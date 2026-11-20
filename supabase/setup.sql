-- CARLA DIAMONDS: paste this entire file into Supabase SQL Editor and Run.
-- Re-runnable. Creates only Carla tables/functions; does not drop existing data.
-- No passwords or API keys belong in SQL. Admin credentials stay in Vercel env.
begin;

create table if not exists public.carla_products (
  id text primary key, slug text not null unique,
  category text not null check (category in ('Necklaces','Earrings','Rings','Bracelets')),
  status text not null check (status in ('active','draft')),
  data jsonb not null check (jsonb_typeof(data)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (data->>'id'=id and data->>'slug'=slug and data->>'status'=status),
  check (jsonb_typeof(data->'variants')='array' and (data->>'price')::numeric>0)
);
create index if not exists carla_products_category_status on public.carla_products(category,status);
create table if not exists public.carla_content (
  kind text not null, key text not null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(kind,key)
);
create table if not exists public.carla_customers (
  id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(email)),
  name text not null, phone text not null default '', password_hash text not null,
  addresses jsonb not null default '[]'::jsonb check(jsonb_typeof(addresses)='array'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.carla_coupons (
  code text primary key, data jsonb not null, used integer not null default 0 check(used>=0)
);
create table if not exists public.carla_orders (
  id uuid primary key default gen_random_uuid(), number text not null unique, email text not null,
  customer_id uuid references public.carla_customers(id) on delete set null,
  data jsonb not null, access_hash text not null, idempotency_key uuid not null unique,
  razorpay_order_id text unique,
  payment_status text not null default 'pending' check(payment_status in ('pending','paid','expired')),
  stock_reserved boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists carla_orders_customer on public.carla_orders(customer_id,created_at desc);
create table if not exists public.carla_payments (
  payment_id text primary key, order_id uuid not null references public.carla_orders(id),
  created_at timestamptz not null default now()
);
create table if not exists public.carla_inventory_movements (
  id uuid primary key default gen_random_uuid(), sku text not null, quantity_change integer not null,
  reason text not null, order_id uuid references public.carla_orders(id), created_at timestamptz not null default now()
);
create table if not exists public.carla_wishlists (
  customer_id uuid primary key references public.carla_customers(id) on delete cascade,
  product_ids jsonb not null default '[]'::jsonb
);
create table if not exists public.carla_reviews (
  id uuid primary key default gen_random_uuid(), product_id text not null,
  customer_id uuid references public.carla_customers(id) on delete set null,
  rating integer not null check(rating between 1 and 5), text text not null,
  moderation_status text not null default 'pending' check(moderation_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.carla_audit_log (
  id uuid primary key default gen_random_uuid(), admin_id text not null, action text not null,
  entity text not null, created_at timestamptz not null default now()
);
create table if not exists public.carla_rate_limits (
  key text primary key, count integer not null, expires_at timestamptz not null
);
create index if not exists carla_rate_limits_expiry on public.carla_rate_limits(expires_at);

-- Customers never receive database credentials with write privileges.
-- Every app query goes through the Next.js server, which checks the signed session.
do $$ declare table_name text; begin
  foreach table_name in array array['carla_products','carla_content','carla_customers','carla_coupons','carla_orders','carla_payments','carla_inventory_movements','carla_wishlists','carla_reviews','carla_audit_log','carla_rate_limits'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on table public.%I from anon, authenticated',table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role',table_name);
  end loop;
end $$;

-- Public product photographs; uploads are restricted to the authenticated app server.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('carla-jewellery','carla-jewellery',true,4194304,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.carla_initialize_catalogue(p_products jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare p jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('carla-catalogue'));
  if exists(select 1 from carla_content where kind='system' and key='catalogue-initialized') then return; end if;
  if not exists(select 1 from carla_products) then
    for p in select value from jsonb_array_elements(p_products) loop
      insert into carla_products(id,slug,category,status,data) values(p->>'id',p->>'slug',p->>'category',p->>'status',p);
    end loop;
  end if;
  insert into carla_content(kind,key,data) values('system','catalogue-initialized',jsonb_build_object('initializedAt',now())) on conflict do nothing;
end $$;

create or replace function public.carla_save_product(p_product jsonb,p_existing_id text default null) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare target text:=p_product->>'id';
begin
  perform pg_advisory_xact_lock(hashtext('carla-catalogue'));
  if p_existing_id is not null and (p_existing_id<>target or not exists(select 1 from carla_products where id=target)) then raise exception 'Product not found or reference changed'; end if;
  if p_existing_id is null and exists(select 1 from carla_products where id=target) then raise exception 'Product already exists'; end if;
  if exists(select 1 from carla_products p cross join lateral jsonb_array_elements(p.data->'variants') old_variant cross join lateral jsonb_array_elements(p_product->'variants') new_variant where p.id<>target and old_variant->>'sku'=new_variant->>'sku') then raise exception 'Variant reference already exists'; end if;
  insert into carla_products(id,slug,category,status,data) values(target,p_product->>'slug',p_product->>'category',p_product->>'status',p_product)
  on conflict(id) do update set slug=excluded.slug,category=excluded.category,status=excluded.status,data=excluded.data,updated_at=now();
  return p_product;
end $$;

create or replace function public.carla_rate_limit(p_key text) returns integer
language plpgsql set search_path=public,pg_temp as $$
declare total integer;
begin
  delete from carla_rate_limits where expires_at<now();
  insert into carla_rate_limits(key,count,expires_at) values(p_key,1,now()+interval '2 minutes')
  on conflict(key) do update set count=carla_rate_limits.count+1 returning count into total;
  return total;
end $$;

-- Checkout reservation is atomic: row locks protect the last available item.
create or replace function public.carla_reserve_order(p_order jsonb) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare item jsonb; product carla_products%rowtype; variant jsonb; variant_index integer;
  quantity integer; subtotal numeric:=0; discount numeric:=0; coupon carla_coupons%rowtype; result carla_orders%rowtype;
begin
  if jsonb_array_length(p_order->'items') not between 1 and 30 then raise exception 'Invalid cart'; end if;
  for item in select value from jsonb_array_elements(p_order->'items') order by value->>'id',value->>'sku' loop
    quantity:=(item->>'quantity')::integer;
    if quantity not between 1 and 10 then raise exception 'Invalid quantity'; end if;
    select * into product from carla_products where id=item->>'id' and status='active' for update;
    if not found then raise exception 'Product is unavailable'; end if;
    select value,(ordinality-1)::integer into variant,variant_index from jsonb_array_elements(product.data->'variants') with ordinality where value->>'sku'=item->>'sku';
    if variant is null or (variant->>'stock')::integer<quantity or round((variant->>'price')::numeric*100)<>round((item->>'price')::numeric*100) then raise exception 'Availability or price changed'; end if;
    subtotal:=subtotal+round((variant->>'price')::numeric*100)*quantity/100;
    update carla_products set data=jsonb_set(data,array['variants',variant_index::text,'stock'],to_jsonb((variant->>'stock')::integer-quantity)),updated_at=now() where id=product.id;
  end loop;
  if coalesce(p_order->>'coupon','')<>'' then
    select * into coupon from carla_coupons where code=p_order->>'coupon' for update;
    if not found or not coalesce((coupon.data->>'active')::boolean,false) or (coupon.data->>'expiry')::timestamptz<=now() or coupon.used>=(coupon.data->>'limit')::integer or subtotal<coalesce((coupon.data->>'minSpend')::numeric,0) then raise exception 'Coupon is unavailable'; end if;
    discount:=least(subtotal,case when coupon.data->>'discountType'='percent' then round(subtotal*least(100,(coupon.data->>'value')::numeric)/100,2) else (coupon.data->>'value')::numeric end);
    update carla_coupons set used=used+1 where code=coupon.code;
  end if;
  if round(subtotal*100)<>round((p_order->>'subtotal')::numeric*100) or round(discount*100)<>round((p_order->>'discount')::numeric*100) or round((subtotal-discount)*100)<>round((p_order->>'total')::numeric*100) then raise exception 'Checkout totals changed'; end if;
  insert into carla_orders(number,email,customer_id,data,access_hash,idempotency_key)
  values(p_order->>'number',p_order->>'email',nullif(p_order->>'customerId','')::uuid,p_order-'accessHash'-'idempotencyKey',p_order->>'accessHash',(p_order->>'idempotencyKey')::uuid) returning * into result;
  return to_jsonb(result);
end $$;

create or replace function public.carla_release_order(p_id uuid) returns void
language plpgsql set search_path=public,pg_temp as $$
declare purchase carla_orders%rowtype; item jsonb; product carla_products%rowtype; variant jsonb; variant_index integer;
begin
  select * into purchase from carla_orders where id=p_id for update;
  if not found or purchase.payment_status<>'pending' or not purchase.stock_reserved then return; end if;
  for item in select value from jsonb_array_elements(purchase.data->'items') order by value->>'id',value->>'sku' loop
    select * into product from carla_products where id=item->>'id' for update;
    if not found then continue; end if;
    select value,(ordinality-1)::integer into variant,variant_index from jsonb_array_elements(product.data->'variants') with ordinality where value->>'sku'=item->>'sku';
    if variant is not null then update carla_products set data=jsonb_set(data,array['variants',variant_index::text,'stock'],to_jsonb((variant->>'stock')::integer+(item->>'quantity')::integer)),updated_at=now() where id=product.id; end if;
  end loop;
  if coalesce(purchase.data->>'coupon','')<>'' then update carla_coupons set used=greatest(0,used-1) where code=purchase.data->>'coupon'; end if;
  update carla_orders set stock_reserved=false,payment_status='expired',updated_at=now() where id=p_id;
end $$;

create or replace function public.carla_mark_paid(p_razorpay_id text,p_payment_id text,p_amount bigint,p_currency text) returns void
language plpgsql set search_path=public,pg_temp as $$
declare purchase carla_orders%rowtype; item jsonb; prior uuid;
begin
  select * into purchase from carla_orders where razorpay_order_id=p_razorpay_id for update;
  if not found then raise exception 'Order not found'; end if;
  if round((purchase.data->>'total')::numeric*100)<>p_amount or p_currency<>'INR' then raise exception 'Payment amount mismatch'; end if;
  if purchase.payment_status='paid' then return; end if;
  if not purchase.stock_reserved then raise exception 'Payment arrived after stock release; manual review required'; end if;
  insert into carla_payments(payment_id,order_id) values(p_payment_id,purchase.id) on conflict do nothing;
  select order_id into prior from carla_payments where payment_id=p_payment_id;
  if prior<>purchase.id then raise exception 'Payment already belongs to another order'; end if;
  update carla_orders set payment_status='paid',data=jsonb_set(data,'{paymentId}',to_jsonb(p_payment_id)),updated_at=now() where id=purchase.id;
  for item in select value from jsonb_array_elements(purchase.data->'items') loop
    insert into carla_inventory_movements(sku,quantity_change,reason,order_id) values(item->>'sku',-(item->>'quantity')::integer,'Order '||purchase.number,purchase.id);
  end loop;
end $$;

-- PostgreSQL grants EXECUTE to PUBLIC by default: explicitly restrict app RPCs.
create or replace function public.carla_add_address(p_customer_id uuid,p_address jsonb) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare addresses jsonb; entry jsonb; normalized jsonb:='[]'::jsonb;
begin
  select c.addresses into addresses from carla_customers c where id=p_customer_id for update;
  if not found then raise exception 'Customer not found'; end if;
  if jsonb_array_length(addresses)=0 then p_address:=jsonb_set(p_address,'{isDefault}','true'::jsonb); end if;
  for entry in select value from jsonb_array_elements(addresses) loop
    if coalesce((p_address->>'isDefault')::boolean,false) then entry:=jsonb_set(entry,'{isDefault}','false'::jsonb); end if;
    normalized:=normalized||jsonb_build_array(entry);
  end loop;
  normalized:=normalized||jsonb_build_array(p_address);
  update carla_customers set addresses=normalized,updated_at=now() where id=p_customer_id;
  return normalized;
end $$;
revoke all on function public.carla_add_address(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.carla_add_address(uuid,jsonb) to service_role;
revoke all on function public.carla_initialize_catalogue(jsonb) from public,anon,authenticated;
revoke all on function public.carla_save_product(jsonb,text) from public,anon,authenticated;
revoke all on function public.carla_rate_limit(text) from public,anon,authenticated;
revoke all on function public.carla_reserve_order(jsonb) from public,anon,authenticated;
revoke all on function public.carla_release_order(uuid) from public,anon,authenticated;
revoke all on function public.carla_mark_paid(text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.carla_initialize_catalogue(jsonb),public.carla_save_product(jsonb,text),public.carla_rate_limit(text),public.carla_reserve_order(jsonb),public.carla_release_order(uuid),public.carla_mark_paid(text,text,bigint,text) to service_role;
notify pgrst,'reload schema';
commit;

-- Expected result: all custom Carla tables have RLS enabled.
select tablename,rowsecurity from pg_tables where schemaname='public' and tablename like 'carla_%' order by tablename;
