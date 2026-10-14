import mongoose,{Schema} from 'mongoose';

const make=(name:string,schema:Schema)=>mongoose.models[name]||mongoose.model(name,schema);

const variant=new Schema({sku:{type:String,required:true},size:String,metal:String,price:{type:Number,min:0,required:true},stock:{type:Number,min:0,required:true}},{_id:false});

const product=new Schema({id:{type:String,unique:true,required:true},slug:{type:String,unique:true,required:true},name:{type:String,required:true},category:{type:String,index:true},description:String,metal:String,purity:String,weight:Number,gemstones:String,images:[String],price:Number,badge:String,occasion:[String],variants:[variant],model3D:String,tryOnAsset:String,status:{type:String,enum:['active','draft'],index:true},sample:Boolean,goldPricing:{type:new Schema({enabled:Boolean,netGoldWeight:Number,stoneWeight:Number,stoneValue:Number,makingCharge:Number,makingChargeType:{type:String,enum:['fixed','perGram','percent']},taxPercent:Number},{_id:false}),default:undefined}},{timestamps:true});

product.index({name:'text',description:'text'});product.index({'variants.sku':1},{unique:true});

export const ProductModel=make('Product',product);

export const Order=make('Order',new Schema({number:{type:String,unique:true},email:String,customerId:String,customer:Schema.Types.Mixed,items:[Schema.Types.Mixed],subtotal:Number,discount:Number,total:Number,coupon:String,currency:{type:String,default:'INR'},paymentStatus:{type:String,default:'pending'},fulfillmentStatus:{type:String,default:'unfulfilled'},razorpayOrderId:{type:String,index:true},paymentId:String,accessHash:String,idempotencyKey:{type:String,unique:true},stockReserved:{type:Boolean,default:true},expiresAt:Date},{timestamps:true}));

export const Payment=make('Payment',new Schema({paymentId:{type:String,unique:true},orderId:String,status:String,signatureVerified:Boolean},{timestamps:true}));

export const Customer=make('Customer',new Schema({email:{type:String,unique:true},name:String,passwordHash:String,phone:String,addresses:[Schema.Types.Mixed]},{timestamps:true}));

export const Review=make('Review',new Schema({productId:String,customerId:String,rating:{type:Number,min:1,max:5},text:String,moderationStatus:{type:String,default:'pending'}},{timestamps:true}));

export const Wishlist=make('Wishlist',new Schema({customerId:{type:String,unique:true},productIds:[String]},{timestamps:true}));

export const Coupon=make('Coupon',new Schema({code:{type:String,unique:true},discountType:{type:String,enum:['percent','fixed']},value:Number,minSpend:Number,limit:Number,used:{type:Number,default:0},expiry:Date,active:Boolean},{timestamps:true}));

export const AuditLog=make('AuditLog',new Schema({adminId:String,action:String,entity:String},{timestamps:true}));

export const InventoryMovement=make('InventoryMovement',new Schema({sku:String,quantityChange:Number,reason:String},{timestamps:true}));

export const Content=make('Content',new Schema({kind:{type:String,index:true},key:String,data:Schema.Types.Mixed},{timestamps:true}));

export const RateLimit=make('RateLimit',new Schema({_id:String,count:Number,expiresAt:{type:Date,index:{expireAfterSeconds:0}}}));
