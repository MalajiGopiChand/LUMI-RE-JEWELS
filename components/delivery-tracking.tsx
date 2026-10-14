'use client';
import {useState,useEffect} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {
  Package,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  Search,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Building,
  Sparkles
} from 'lucide-react';

interface TrackingEvent {
  time: string;
  date: string;
  status: string;
  location: string;
  detail: string;
  completed: boolean;
}

interface ShipmentData {
  orderId: string;
  awb: string;
  courier: string;
  serviceType: string;
  status: 'confirmed' | 'vault_packed' | 'in_transit' | 'out_for_delivery' | 'delivered';
  statusText: string;
  statusDescription: string;
  estimatedDelivery: string;
  currentLocation: string;
  origin: string;
  destination: string;
  recipientName: string;
  items: Array<{ name: string; sku: string; qty: number; value: string }>;
  timeline: TrackingEvent[];
}

const DEMO_SHIPMENTS: Record<string, ShipmentData> = {
  'CD-94812': {
    orderId: 'CD-94812',
    awb: 'SQL-MUM-892147',
    courier: 'Sequel Secured Luxury Logistics',
    serviceType: 'Armoured High-Value Transit · 100% Insured',
    status: 'out_for_delivery',
    statusText: 'Out for Delivery Today',
    statusDescription: 'Your parcel is with our armed courier delivery officer. Please keep your government photo ID and delivery OTP ready.',
    estimatedDelivery: 'Today by 4:30 PM',
    currentLocation: 'Indiranagar Hub, Bengaluru',
    origin: 'Carla Atelier Vault, Bandra West, Mumbai',
    destination: 'Bengaluru, Karnataka - 560038',
    recipientName: 'Priya Sharma',
    items: [
      { name: 'Carla Pavé Diamond Ring in 18K Yellow Gold', sku: 'CR-18K-54', qty: 1, value: '₹58,400' },
      { name: 'Solitaire Pendant Necklace in 18K Yellow Gold', sku: 'CN-18K-45', qty: 1, value: '₹42,800' }
    ],
    timeline: [
      {
        date: 'Today',
        time: '09:15 AM',
        status: 'Out for Delivery with Armed Security Escort',
        location: 'Indiranagar Delivery Centre, Bengaluru',
        detail: 'Dispatched in GPS-monitored high-security van. Contactless OTP verification will be required upon receipt.',
        completed: true
      },
      {
        date: 'Today',
        time: '05:40 AM',
        status: 'Arrived at Destination Airport Gateway',
        location: 'Kempegowda International Airport (BLR), Bengaluru',
        detail: 'Inspected and cleared via secured air cargo terminal.',
        completed: true
      },
      {
        date: 'Yesterday',
        time: '09:30 PM',
        status: 'Departed Origin Logistics Gateway',
        location: 'Chhatrapati Shivaji Maharaj Int’l Airport (BOM), Mumbai',
        detail: 'Secured in tamper-evident sealed strongbox for scheduled air transit.',
        completed: true
      },
      {
        date: 'Yesterday',
        time: '03:15 PM',
        status: 'Vault Packing & Tamper-Evident RFID Sealed',
        location: 'Carla Diamonds Flagship Atelier, Bandra, Mumbai',
        detail: 'Jewellery placed inside signature suede velvet box, sealed with tamper-evident serial-numbered hologram #CD-HL-90124.',
        completed: true
      },
      {
        date: '12 Oct 2026',
        time: '11:20 AM',
        status: 'BIS 916 Hallmark Certified & Quality Passed',
        location: 'Assaying & Hallmarking Centre, Mumbai',
        detail: 'Govt. approved BIS 916 purity laser inscribed; diamond solitaire certificates verified.',
        completed: true
      }
    ]
  },
  'CD-89241': {
    orderId: 'CD-89241',
    awb: 'BLR-EXP-662391',
    courier: 'BlueDart Apex Priority Insured',
    serviceType: 'Valuable Cargo Secure Air Express',
    status: 'in_transit',
    statusText: 'In Transit · Air Express',
    statusDescription: 'Your jewellery is securely sealed and in transit to the regional delivery hub.',
    estimatedDelivery: 'Tomorrow by 2:00 PM',
    currentLocation: 'National Transit Gateway, Hyderabad',
    origin: 'Carla Atelier Vault, Mumbai',
    destination: 'Banjara Hills, Hyderabad - 500034',
    recipientName: 'Vikramaditya Roy',
    items: [
      { name: 'Carla Classic Gold Chain 22K', sku: 'CC-22K-60', qty: 1, value: '₹94,200' }
    ],
    timeline: [
      {
        date: 'Today',
        time: '11:45 AM',
        status: 'Arrived at Regional Sorting Hub',
        location: 'Rajiv Gandhi Int’l Airport Cargo Terminal, Hyderabad',
        detail: 'High-value cage security verification completed.',
        completed: true
      },
      {
        date: 'Yesterday',
        time: '08:15 PM',
        status: 'Departed Origin Gateway',
        location: 'Mumbai Air Cargo Hub',
        detail: 'Handed over to priority night air freighter.',
        completed: true
      },
      {
        date: 'Yesterday',
        time: '02:00 PM',
        status: 'Quality Checked & Insured Packaging Sealed',
        location: 'Carla Mumbai Atelier',
        detail: 'Seal ID #CD-HL-88219.',
        completed: true
      }
    ]
  },
  'CD-78219': {
    orderId: 'CD-78219',
    awb: 'SQL-DEL-441098',
    courier: 'Sequel Secured Luxury Logistics',
    serviceType: 'Armoured Hand-Delivery · Signed & Verified',
    status: 'delivered',
    statusText: 'Delivered & Handed Over',
    statusDescription: 'Package successfully received and inspected against OTP verification.',
    estimatedDelivery: 'Delivered on 13 Oct 2026 at 03:22 PM',
    currentLocation: 'Vasant Vihar, New Delhi',
    origin: 'Carla Atelier Vault, Mumbai',
    destination: 'New Delhi - 110057',
    recipientName: 'Ananya Deshmukh',
    items: [
      { name: 'Emerald Drop Earrings in 18K Yellow Gold', sku: 'CE-18K-12', qty: 1, value: '₹76,500' }
    ],
    timeline: [
      {
        date: '13 Oct 2026',
        time: '03:22 PM',
        status: 'Delivered to Recipient with OTP Verification',
        location: 'Vasant Vihar, New Delhi',
        detail: 'Signed by recipient with photo verification. Tamper seal verified intact at the time of delivery.',
        completed: true
      },
      {
        date: '13 Oct 2026',
        time: '10:10 AM',
        status: 'Out for Delivery with Security Officer',
        location: 'South Delhi Centre',
        detail: 'Security delivery officer assigned.',
        completed: true
      },
      {
        date: '12 Oct 2026',
        time: '04:15 PM',
        status: 'Order Dispatched from Atelier',
        location: 'Carla Flagship Mumbai',
        detail: 'Package sealed in insured tamper box.',
        completed: true
      }
    ]
  }
};

export function DeliveryTracking() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id') || searchParams.get('order') || searchParams.get('awb');
  const [query, setQuery] = useState(requestedId || 'CD-94812');
  const [activeShipment, setActiveShipment] = useState<ShipmentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function loadShipment(id: string) {
    const cleanId = id.trim().toUpperCase();
    setLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      // Direct demo match
      if (DEMO_SHIPMENTS[cleanId]) {
        setActiveShipment(DEMO_SHIPMENTS[cleanId]);
        setLoading(false);
        return;
      }

      // Check session order
      try {
        const demoOrder = JSON.parse(sessionStorage.getItem('lumiere-demo-order') || 'null');
        if (demoOrder && (demoOrder.number === cleanId || cleanId.includes('DEMO') || cleanId.includes('ORDER'))) {
          const generatedShipment: ShipmentData = {
            orderId: demoOrder.number || cleanId,
            awb: 'SQL-VAL-' + Math.floor(100000 + Math.random() * 900000),
            courier: 'Sequel Secured Luxury Logistics',
            serviceType: 'Armoured High-Value Transit · 100% Insured',
            status: 'in_transit',
            statusText: 'In Transit · Handed to Armoured Courier',
            statusDescription: 'Your jewellery has been BIS hallmarked and dispatched in tamper-evident secure packaging.',
            estimatedDelivery: 'Estimated within 2 business days',
            currentLocation: 'Central Transit Vault, Mumbai',
            origin: 'Carla Flagship Atelier, Bandra West, Mumbai',
            destination: demoOrder.shipping?.city ? `${demoOrder.shipping.city}, India - ${demoOrder.shipping.postalCode || ''}` : 'Your Delivery Address, India',
            recipientName: demoOrder.shipping?.name || 'Valued Recipient',
            items: demoOrder.items?.map((item: any) => ({
              name: item.name,
              sku: item.sku,
              qty: item.quantity,
              value: `₹${(item.price * item.quantity).toLocaleString('en-IN')}`
            })) || [{ name: 'Handcrafted Carla Diamonds Jewellery', sku: 'CD-JEWEL-01', qty: 1, value: '₹48,000' }],
            timeline: [
              {
                date: 'Today',
                time: 'Just now',
                status: 'Dispatched via Armoured Secured Transit',
                location: 'Mumbai Sorting Hub',
                detail: 'Sealed in tamper-evident vault box with RFID security lock.',
                completed: true
              },
              {
                date: 'Today',
                time: '2 hours ago',
                status: 'BIS Hallmark Certified & Vault Sealed',
                location: 'Carla Mumbai Atelier',
                detail: 'Purity inspection and double-box tamper seal applied.',
                completed: true
              },
              {
                date: 'Today',
                time: '4 hours ago',
                status: 'Order Confirmed & Atelier Assigned',
                location: 'Carla Diamonds Digital Boutique',
                detail: 'Order verified and authorized for priority vault processing.',
                completed: true
              }
            ]
          };
          setActiveShipment(generatedShipment);
          setLoading(false);
          return;
        }
      } catch {}

      // Fallback: Generate dynamic realistic tracking for any custom query entered by user
      if (cleanId.length >= 3) {
        const customShipment: ShipmentData = {
          orderId: cleanId.startsWith('CD-') ? cleanId : `CD-${cleanId}`,
          awb: 'SQL-EXP-' + Math.floor(100000 + Math.random() * 900000),
          courier: 'Sequel Secured Luxury Logistics',
          serviceType: 'Armoured Priority Escort · 100% Insured',
          status: 'in_transit',
          statusText: 'In Transit to Destination Hub',
          statusDescription: 'Your jewellery package is secured in our temperature-controlled armored vehicle with real-time GPS tracking.',
          estimatedDelivery: 'Expected in 1-2 business days',
          currentLocation: 'National Hub, Mumbai Gateway',
          origin: 'Carla Diamonds Atelier, Mumbai',
          destination: 'Customer Delivery Address, India',
          recipientName: 'Valued Customer',
          items: [
            { name: 'Selected Carla Diamonds Fine Jewellery', sku: 'CD-SEL-916', qty: 1, value: '₹62,000' }
          ],
          timeline: [
            {
              date: 'Today',
              time: '10:30 AM',
              status: 'Departed Transit Hub',
              location: 'Mumbai Secured Logistics Center',
              detail: 'En route to local delivery facility.',
              completed: true
            },
            {
              date: 'Yesterday',
              time: '04:15 PM',
              status: 'Insured Vault Packaging Completed',
              location: 'Carla Flagship Atelier, Bandra',
              detail: 'Sealed with tamper-proof golden security hologram.',
              completed: true
            },
            {
              date: 'Yesterday',
              time: '11:00 AM',
              status: 'Order Hallmarked & Passed 4-Eye Quality Check',
              location: 'Mumbai Atelier',
              detail: 'BIS certified and gemstone authentication verified.',
              completed: true
            }
          ]
        };
        setActiveShipment(customShipment);
        setLoading(false);
      } else {
        setErrorMessage('Please enter a valid Order ID (e.g., CD-94812) or AWB Tracking Number.');
        setLoading(false);
      }
    }, 350);
  }

  useEffect(() => {
    loadShipment(query);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      loadShipment(query);
    }
  }

  function copyAwb(awb: string) {
    navigator.clipboard?.writeText(awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Stepper calculations
  const steps = [
    { key: 'confirmed', title: 'Order Confirmed', subtitle: 'BIS Hallmarked' },
    { key: 'vault_packed', title: 'Vault Packaging', subtitle: 'RFID Tamper Sealed' },
    { key: 'in_transit', title: 'Secured In Transit', subtitle: 'Armoured Air Express' },
    { key: 'out_for_delivery', title: 'Out for Delivery', subtitle: 'Armed Courier OTP' },
    { key: 'delivered', title: 'Hand Delivered', subtitle: 'Signed & Inspected' }
  ];

  const currentStepIndex = activeShipment?.status === 'delivered' ? 4
    : activeShipment?.status === 'out_for_delivery' ? 3
    : activeShipment?.status === 'in_transit' ? 2
    : activeShipment?.status === 'vault_packed' ? 1 : 0;

  const whatsappMessage = activeShipment
    ? encodeURIComponent(`Hello Carla Boutique Concierge, I am inquiring about the delivery status of my order #${activeShipment.orderId} (AWB: ${activeShipment.awb}). Could you please share the current live update?`)
    : encodeURIComponent('Hello Carla Boutique Concierge, I would like assistance with tracking my jewellery order.');

  return (
    <div className="tracking-page-container">
      <div className="page-title">
        <p className="eyebrow">CARLA SECURE TRANSIT · ARMOURED DELIVERY</p>
        <h1>Track your delivery.</h1>
        <p>Real-time GPS updates, tamper-evident security checkpoints, and insured hand-delivery.</p>
      </div>

      <div className="tracking-content-wrapper">
        {/* Search Bar */}
        <section className="tracking-search-card">
          <form className="tracking-search-form" onSubmit={handleSearch}>
            <div className="tracking-input-group">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. CD-94812) or AWB Tracking #"
                aria-label="Order or Tracking Number"
                required
              />
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Locating…' : 'Track Delivery'}
              </button>
            </div>
          </form>

          {/* Quick sample pills */}
          <div className="sample-tracking-pills">
            <span className="pills-label">Quick sample shipments:</span>
            <button
              type="button"
              className={query === 'CD-94812' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => { setQuery('CD-94812'); loadShipment('CD-94812'); }}
            >
              #CD-94812 (Out for delivery)
            </button>
            <button
              type="button"
              className={query === 'CD-89241' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => { setQuery('CD-89241'); loadShipment('CD-89241'); }}
            >
              #CD-89241 (In Transit)
            </button>
            <button
              type="button"
              className={query === 'CD-78219' ? 'pill-btn active' : 'pill-btn'}
              onClick={() => { setQuery('CD-78219'); loadShipment('CD-78219'); }}
            >
              #CD-78219 (Delivered)
            </button>
          </div>

          {errorMessage && <p className="error-banner"><AlertCircle size={15}/> {errorMessage}</p>}
        </section>

        {activeShipment && (
          <>
            {/* Top Status Banner */}
            <div className="shipment-status-card">
              <div className="shipment-status-header">
                <div>
                  <div className="badge-row">
                    <span className={`status-badge ${activeShipment.status}`}>
                      {activeShipment.statusText}
                    </span>
                    <span className="insurance-badge">
                      <ShieldCheck size={13} /> 100% Transit Insured
                    </span>
                  </div>
                  <h2>Estimated Delivery: <strong>{activeShipment.estimatedDelivery}</strong></h2>
                  <p className="status-desc">{activeShipment.statusDescription}</p>
                </div>

                <div className="awb-action-box">
                  <div className="awb-info">
                    <small>AIR WAYBILL (AWB)</small>
                    <code>{activeShipment.awb}</code>
                  </div>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyAwb(activeShipment.awb)}
                    title="Copy AWB Number"
                  >
                    {copied ? <Check size={14} className="copied" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy AWB'}</span>
                  </button>
                </div>
              </div>

              {/* Visual 5-Stage Stepper */}
              <div className="tracking-stepper">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.key} className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="step-circle">
                        {isDone ? <Check size={14} /> : <span>{idx + 1}</span>}
                      </div>
                      <div className="step-text">
                        <strong>{step.title}</strong>
                        <small>{step.subtitle}</small>
                      </div>
                      {idx < steps.length - 1 && <div className={`step-line ${idx < currentStepIndex ? 'done' : ''}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Key metadata grid */}
              <div className="shipment-meta-grid">
                <div>
                  <small>SECURED COURIER</small>
                  <strong>{activeShipment.courier}</strong>
                  <span>{activeShipment.serviceType}</span>
                </div>
                <div>
                  <small>CURRENT LOCATION</small>
                  <strong><MapPin size={13}/> {activeShipment.currentLocation}</strong>
                  <span>Route: {activeShipment.origin} → {activeShipment.destination}</span>
                </div>
                <div>
                  <small>RECIPIENT & DESTINATION</small>
                  <strong>{activeShipment.recipientName}</strong>
                  <span>{activeShipment.destination}</span>
                </div>
              </div>
            </div>

            {/* Two-column layout: Timeline & Package Items */}
            <div className="tracking-details-grid">
              {/* Detailed Activity Timeline */}
              <div className="timeline-card">
                <h3>Live Checkpoint Milestones</h3>
                <div className="timeline-list">
                  {activeShipment.timeline.map((event, index) => (
                    <div key={index} className="timeline-entry">
                      <div className="timeline-bullet">
                        <div className="bullet-dot" />
                      </div>
                      <div className="timeline-body">
                        <div className="timeline-header">
                          <strong>{event.status}</strong>
                          <span className="timestamp">{event.date} · {event.time}</span>
                        </div>
                        <p className="timeline-location"><MapPin size={12}/> {event.location}</p>
                        <p className="timeline-detail">{event.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package & Concierge Help */}
              <div className="package-side-card">
                <div className="package-items-box">
                  <h3>Jewellery in this Shipment</h3>
                  <div className="items-list">
                    {activeShipment.items.map((item, i) => (
                      <div key={i} className="package-item-row">
                        <div className="item-icon">
                          <Sparkles size={16} />
                        </div>
                        <div className="item-info">
                          <strong>{item.name}</strong>
                          <small>SKU: {item.sku} · Qty: {item.qty}</small>
                        </div>
                        <div className="item-price">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="delivery-security-box">
                  <h4><ShieldCheck size={16}/> Carla Delivery Protocol</h4>
                  <ul>
                    <li><strong>Tamper-Proof Box:</strong> Inspect the gold hologram seal before accepting. Do not accept if broken.</li>
                    <li><strong>Secure OTP Handover:</strong> Share your SMS OTP with the courier only after the outer box is handed to you.</li>
                    <li><strong>100% Insured:</strong> Full transit insurance covered by Carla Diamonds until physical handover.</li>
                  </ul>
                </div>

                <div className="concierge-support-box">
                  <h4>Need assistance with this shipment?</h4>
                  <p>Our dedicated shipping concierge is available on WhatsApp for live updates or delivery schedule adjustments.</p>
                  <a
                    href={`https://wa.me/917672021223?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button concierge-btn"
                  >
                    <MessageCircle size={16}/> Chat with Shipping Concierge
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
