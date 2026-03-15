import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:"#1B4F72", primaryLight:"#2E86C1", primaryLighter:"#EBF5FB",
  accent:"#F39C12", success:"#1E8449", successLight:"#EAFAF1",
  danger:"#C0392B", warning:"#E67E22", purple:"#7D3C98",
  text:"#1A252F", textMuted:"#5D6D7E",
  border:"#D5D8DC", bg:"#F4F6F8", white:"#FFFFFF", sidebar:"#0D2137",
};
const card  = { background:C.white, borderRadius:10, border:`1px solid ${C.border}`, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" };
const inp   = { width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:7, fontSize:14, color:C.text, outline:"none", boxSizing:"border-box", background:C.white };
const lbl   = { fontSize:13, fontWeight:600, color:C.text, marginBottom:6, display:"block" };
const btn   = (v="primary") => ({ padding:"9px 18px", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", background:v==="primary"?C.primary:v==="success"?C.success:v==="danger"?C.danger:v==="purple"?C.purple:v==="accent"?C.accent:v==="outline"?"transparent":C.bg, color:["primary","success","danger","purple","accent"].includes(v)?C.white:v==="outline"?C.primary:C.text, border:v==="outline"?`1.5px solid ${C.primary}`:"none", display:"flex", alignItems:"center", gap:7 });
const badge = (color) => ({ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20, background:color+"22", color, textTransform:"uppercase", letterSpacing:0.5 });
const TH    = { textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.5, background:C.bg, borderBottom:`1px solid ${C.border}` };
const TD    = { padding:"12px 14px", fontSize:13, color:C.text, borderBottom:`1px solid ${C.border}` };
const fmt   = (n) => "₹" + Number(n||0).toLocaleString("en-IN");

// ─── GST Rates ────────────────────────────────────────────────────────────────
const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_SALES = [
  { id:"s1", company_id:"c1", invoice_number:"INV-001", invoice_date:"2024-03-01", customer_name:"Reliance Industries", gstin:"27AAGCR1234A1Z5", hsn:"996311", taxable_value:250000, gst_rate:18, cgst:22500, sgst:22500, igst:0, total_value:295000 },
  { id:"s2", company_id:"c1", invoice_number:"INV-002", invoice_date:"2024-03-05", customer_name:"Tata Motors Ltd", gstin:"24AAACT2727Q1ZW", hsn:"871310", taxable_value:180000, gst_rate:28, cgst:0, sgst:0, igst:50400, total_value:230400 },
  { id:"s3", company_id:"c1", invoice_number:"INV-003", invoice_date:"2024-03-10", customer_name:"Infosys BPM", gstin:"29AABCI1681E1ZM", hsn:"998314", taxable_value:95000, gst_rate:18, cgst:8550, sgst:8550, igst:0, total_value:112100 },
];
const MOCK_PURCHASES = [
  { id:"p1", company_id:"c1", bill_number:"BILL-101", bill_date:"2024-03-02", supplier_name:"Microsoft India", gstin:"36AAACM3025E1Z5", hsn:"998315", taxable_value:85000, gst_rate:18, cgst:7650, sgst:7650, igst:0, total_value:100300 },
  { id:"p2", company_id:"c1", bill_number:"BILL-102", bill_date:"2024-03-08", supplier_name:"Amazon AWS India", gstin:"29AABCA0301J1Z8", hsn:"998316", taxable_value:42000, gst_rate:18, cgst:3780, sgst:3780, igst:0, total_value:49560 },
];
const MOCK_CLIENTS = [
  { id:"cl1", company_name:"Sharma Traders", gstin:"27ABCDE1234F1Z5", state:"Maharashtra", status:"Active", contact_name:"Amit Sharma", email:"amit@sharma.com", mobile:"9876543210" },
  { id:"cl2", company_name:"Patel Enterprises", gstin:"24BCDEF2345G1Z6", state:"Gujarat", status:"Active", contact_name:"Rohan Patel", email:"rohan@patel.com", mobile:"9876543211" },
  { id:"cl3", company_name:"Kumar & Sons", gstin:"07CDEFG3456H1Z7", state:"Delhi", status:"Active", contact_name:"Vijay Kumar", email:"vijay@kumar.com", mobile:"9876543212" },
];
const COMPLIANCE = [
  { task:"GSTR-1 Filing", due:"11 Apr 2024", period:"Mar 2024", color:"#2E86C1", type:"GST" },
  { task:"GSTR-3B Filing", due:"20 Apr 2024", period:"Mar 2024", color:"#F39C12", type:"GST" },
  { task:"TDS Deposit", due:"07 May 2024", period:"Apr 2024", color:"#E67E22", type:"TDS" },
  { task:"Annual Return GSTR-9", due:"31 Dec 2024", period:"FY 2023-24", color:"#1B4F72", type:"Annual" },
  { task:"Income Tax Return", due:"31 Jul 2024", period:"FY 2023-24", color:"#C0392B", type:"ITR" },
];
const PLANS = [
  { id:"free", name:"Free", price:0, color:"#5D6D7E", features:["1 GSTIN","Unlimited Invoices","GST Reports","Compliance Calendar","5 Clients","Email Support"], limit:"Free forever" },
  { id:"starter", name:"Starter", price:299, color:"#2E86C1", popular:false, features:["3 GSTINs","Unlimited Invoices","All GST Reports","Excel Upload","50 Clients","AI Assistant (50 queries/mo)","WhatsApp Reminders","Priority Support"], limit:"Per month" },
  { id:"pro", name:"Pro", price:799, color:"#1B4F72", popular:true, features:["10 GSTINs","Everything in Starter","AI Assistant Unlimited","CA Marketplace Access","E-Invoice Generation","E-Way Bill","Bank Reconciliation","Multi-user (5 seats)","API Access","24/7 Support"], limit:"Per month" },
  { id:"enterprise", name:"Enterprise", price:1999, color:"#7D3C98", popular:false, features:["Unlimited GSTINs","Everything in Pro","Unlimited Users","White-label Option","Dedicated CA Manager","Custom Integrations","Tally/Busy Import","Offline Mode","SLA Guarantee"], limit:"Per month" },
];

const CA_PROFESSIONALS = [
  // Mumbai (400xxx)
  { id:"ca1",  name:"CA Priya Sharma",     city:"Mumbai",      state:"Maharashtra",    pincode:"400001", area:"Fort",           specialization:"GST Filing, ITR",           experience:8,  rating:4.9, reviews:127, price:2500, verified:true,  languages:["Hindi","English","Marathi"],   mobile:"9876500001", email:"priya@casharma.in" },
  { id:"ca2",  name:"CA Rohit Mehta",      city:"Mumbai",      state:"Maharashtra",    pincode:"400069", area:"Andheri West",   specialization:"E-commerce, GST, TDS",       experience:6,  rating:4.7, reviews:88,  price:2000, verified:true,  languages:["Hindi","English","Marathi"],   mobile:"9876500002", email:"rohit@camehta.in" },
  { id:"ca3",  name:"CA Sneha Desai",      city:"Mumbai",      state:"Maharashtra",    pincode:"400080", area:"Powai",          specialization:"Manufacturing, GST Audit",   experience:11, rating:4.8, reviews:145, price:3200, verified:true,  languages:["Hindi","English","Gujarati"],  mobile:"9876500003", email:"sneha@cadesai.in" },
  // Delhi (110xxx)
  { id:"ca4",  name:"CA Rajesh Gupta",     city:"Delhi",       state:"Delhi",          pincode:"110001", area:"Connaught Place", specialization:"GST Audit, Litigation",     experience:12, rating:4.8, reviews:89,  price:3500, verified:true,  languages:["Hindi","English"],             mobile:"9876500004", email:"rajesh@cagupta.in" },
  { id:"ca5",  name:"CA Neha Agarwal",     city:"Delhi",       state:"Delhi",          pincode:"110092", area:"Preet Vihar",    specialization:"ITR, Income Tax, TDS",       experience:7,  rating:4.6, reviews:63,  price:2200, verified:true,  languages:["Hindi","English"],             mobile:"9876500005", email:"neha@caagarwal.in" },
  { id:"ca6",  name:"CA Amit Saxena",      city:"Delhi",       state:"Delhi",          pincode:"110025", area:"South Extension", specialization:"Startup Compliance, GST",   experience:5,  rating:4.5, reviews:42,  price:1800, verified:false, languages:["Hindi","English"],             mobile:"9876500006", email:"amit@casaxena.in" },
  // Bangalore (560xxx)
  { id:"ca7",  name:"CA Meera Nair",       city:"Bangalore",   state:"Karnataka",      pincode:"560001", area:"MG Road",        specialization:"Startup Compliance, GST",    experience:6,  rating:4.7, reviews:64,  price:2000, verified:true,  languages:["English","Kannada","Malayalam"],mobile:"9876500007", email:"meera@canair.in" },
  { id:"ca8",  name:"CA Kiran Rao",        city:"Bangalore",   state:"Karnataka",      pincode:"560037", area:"Koramangala",    specialization:"IT Sector GST, TDS",         experience:9,  rating:4.8, reviews:112, price:2800, verified:true,  languages:["English","Kannada","Telugu"],  mobile:"9876500008", email:"kiran@carao.in" },
  // Ahmedabad (380xxx)
  { id:"ca9",  name:"CA Suresh Patel",     city:"Ahmedabad",   state:"Gujarat",        pincode:"380001", area:"Law Garden",     specialization:"Manufacturing GST",          experience:15, rating:4.9, reviews:203, price:4000, verified:true,  languages:["Hindi","English","Gujarati"],  mobile:"9876500009", email:"suresh@capatel.in" },
  { id:"ca10", name:"CA Hardik Shah",      city:"Ahmedabad",   state:"Gujarat",        pincode:"380015", area:"Navrangpura",    specialization:"Export, Import, GST",        experience:10, rating:4.7, reviews:98,  price:3000, verified:true,  languages:["Hindi","English","Gujarati"],  mobile:"9876500010", email:"hardik@cashah.in" },
  // Pune (411xxx)
  { id:"ca11", name:"CA Anita Joshi",      city:"Pune",        state:"Maharashtra",    pincode:"411001", area:"Shivajinagar",   specialization:"E-commerce, GST",            experience:5,  rating:4.6, reviews:41,  price:1800, verified:false, languages:["Hindi","English","Marathi"],   mobile:"9876500011", email:"anita@cajoshi.in" },
  { id:"ca12", name:"CA Prasad Kulkarni",  city:"Pune",        state:"Maharashtra",    pincode:"411045", area:"Wakad",          specialization:"Manufacturing, GST Audit",   experience:13, rating:4.9, reviews:178, price:3500, verified:true,  languages:["Hindi","English","Marathi"],   mobile:"9876500012", email:"prasad@cakulkarni.in" },
  // Jaipur (302xxx)
  { id:"ca13", name:"CA Vikram Singh",     city:"Jaipur",      state:"Rajasthan",      pincode:"302001", area:"MI Road",        specialization:"Real Estate GST",            experience:10, rating:4.8, reviews:156, price:3000, verified:true,  languages:["Hindi","English"],             mobile:"9876500013", email:"vikram@casingh.in" },
  { id:"ca14", name:"CA Pooja Sharma",     city:"Jaipur",      state:"Rajasthan",      pincode:"302017", area:"Vaishali Nagar", specialization:"GST Filing, ITR",            experience:4,  rating:4.5, reviews:29,  price:1500, verified:false, languages:["Hindi","English"],             mobile:"9876500014", email:"pooja@casharma2.in" },
  // Chennai (600xxx)
  { id:"ca15", name:"CA Ravi Kumar",       city:"Chennai",     state:"Tamil Nadu",     pincode:"600001", area:"Parry's Corner", specialization:"Manufacturing, Export GST",  experience:14, rating:4.9, reviews:221, price:4500, verified:true,  languages:["English","Tamil"],             mobile:"9876500015", email:"ravi@cakumar.in" },
  { id:"ca16", name:"CA Deepa Iyer",       city:"Chennai",     state:"Tamil Nadu",     pincode:"600096", area:"Velachery",      specialization:"IT Sector, Startup GST",     experience:7,  rating:4.7, reviews:77,  price:2400, verified:true,  languages:["English","Tamil","Telugu"],    mobile:"9876500016", email:"deepa@caiyer.in" },
  // Hyderabad (500xxx)
  { id:"ca17", name:"CA Srinivas Reddy",   city:"Hyderabad",   state:"Telangana",      pincode:"500001", area:"Abids",          specialization:"Pharma, GST, TDS",           experience:11, rating:4.8, reviews:134, price:3200, verified:true,  languages:["English","Telugu","Hindi"],    mobile:"9876500017", email:"srinivas@careddy.in" },
  { id:"ca18", name:"CA Madhavi Rao",      city:"Hyderabad",   state:"Telangana",      pincode:"500081", area:"Gachibowli",     specialization:"E-commerce, GST Filing",     experience:6,  rating:4.6, reviews:55,  price:2100, verified:true,  languages:["English","Telugu"],            mobile:"9876500018", email:"madhavi@carao2.in" },
  // Kolkata (700xxx)
  { id:"ca19", name:"CA Subhash Ghosh",    city:"Kolkata",     state:"West Bengal",    pincode:"700001", area:"BBD Bagh",       specialization:"Trading, GST, ITR",          experience:16, rating:4.9, reviews:267, price:5000, verified:true,  languages:["Hindi","English","Bengali"],   mobile:"9876500019", email:"subhash@caghosh.in" },
  { id:"ca20", name:"CA Ritu Banerjee",    city:"Kolkata",     state:"West Bengal",    pincode:"700107", area:"New Town",       specialization:"Textile, GST Audit",         experience:9,  rating:4.7, reviews:91,  price:2700, verified:true,  languages:["Hindi","English","Bengali"],   mobile:"9876500020", email:"ritu@cabanerjee.in" },
  // Indore (452xxx)
  { id:"ca21", name:"CA Manish Choure",    city:"Indore",      state:"Madhya Pradesh", pincode:"452001", area:"Palasia",        specialization:"GST Filing, ITR, TDS",       experience:8,  rating:4.8, reviews:103, price:2200, verified:true,  languages:["Hindi","English"],             mobile:"9876500021", email:"manish@cachoure.in" },
  { id:"ca22", name:"CA Sunita Verma",     city:"Indore",      state:"Madhya Pradesh", pincode:"452010", area:"Vijay Nagar",    specialization:"Manufacturing GST",          experience:12, rating:4.7, reviews:89,  price:2800, verified:true,  languages:["Hindi","English"],             mobile:"9876500022", email:"sunita@caverma.in" },
  { id:"ca23", name:"CA Deepak Malviya",   city:"Indore",      state:"Madhya Pradesh", pincode:"452003", area:"MG Road",        specialization:"Real Estate, GST, ITR",      experience:9,  rating:4.6, reviews:74,  price:2400, verified:true,  languages:["Hindi","English"],             mobile:"9876500023", email:"deepak@camalviya.in" },
  // Lucknow (226xxx)
  { id:"ca24", name:"CA Arun Mishra",      city:"Lucknow",     state:"Uttar Pradesh",  pincode:"226001", area:"Hazratganj",     specialization:"Real Estate, GST",           experience:10, rating:4.6, reviews:78,  price:2500, verified:true,  languages:["Hindi","English"],             mobile:"9876500024", email:"arun@camishra.in" },
  { id:"ca25", name:"CA Priti Srivastava", city:"Lucknow",     state:"Uttar Pradesh",  pincode:"226016", area:"Gomti Nagar",    specialization:"ITR, TDS, GST",              experience:6,  rating:4.5, reviews:44,  price:1800, verified:false, languages:["Hindi","English"],             mobile:"9876500025", email:"priti@casrivastava.in" },
  // Surat (395xxx)
  { id:"ca26", name:"CA Bhavesh Shah",     city:"Surat",       state:"Gujarat",        pincode:"395001", area:"Ring Road",      specialization:"Textile, Diamond GST",       experience:13, rating:4.9, reviews:189, price:3800, verified:true,  languages:["Hindi","English","Gujarati"],  mobile:"9876500026", email:"bhavesh@cashah2.in" },
  { id:"ca27", name:"CA Hetal Modi",       city:"Surat",       state:"Gujarat",        pincode:"395007", area:"Adajan",         specialization:"Export, GST Filing",         experience:7,  rating:4.6, reviews:61,  price:2300, verified:true,  languages:["Hindi","English","Gujarati"],  mobile:"9876500027", email:"hetal@camodi.in" },
  // Nagpur (440xxx)
  { id:"ca28", name:"CA Vijay Wankhede",   city:"Nagpur",      state:"Maharashtra",    pincode:"440010", area:"Dharampeth",     specialization:"Agriculture, GST",           experience:9,  rating:4.7, reviews:67,  price:2000, verified:true,  languages:["Hindi","English","Marathi"],   mobile:"9876500028", email:"vijay@cawankhede.in" },
  // Bhopal (462xxx)
  { id:"ca29", name:"CA Rakesh Tiwari",    city:"Bhopal",      state:"Madhya Pradesh", pincode:"462001", area:"New Market",     specialization:"GST Filing, ITR",            experience:7,  rating:4.6, reviews:52,  price:1900, verified:true,  languages:["Hindi","English"],             mobile:"9876500029", email:"rakesh@catiwari.in" },
  // Chandigarh (160xxx)
  { id:"ca30", name:"CA Gurpreet Singh",   city:"Chandigarh",  state:"Punjab",         pincode:"160017", area:"Sector 17",      specialization:"Export, GST, TDS",           experience:11, rating:4.8, reviews:121, price:3000, verified:true,  languages:["Hindi","English","Punjabi"],   mobile:"9876500030", email:"gurpreet@casingh2.in" },
  // Kochi (682xxx)
  { id:"ca31", name:"CA Thomas Mathew",    city:"Kochi",       state:"Kerala",         pincode:"682001", area:"MG Road",        specialization:"Tourism, GST, ITR",          experience:8,  rating:4.7, reviews:76,  price:2300, verified:true,  languages:["English","Malayalam"],         mobile:"9876500031", email:"thomas@camathew.in" },
  // Noida (201xxx)
  { id:"ca32", name:"CA Deepak Sharma",    city:"Noida",       state:"Uttar Pradesh",  pincode:"201301", area:"Sector 18",      specialization:"IT Sector, Startup GST",     experience:5,  rating:4.5, reviews:36,  price:1900, verified:false, languages:["Hindi","English"],             mobile:"9876500032", email:"deepak@casharma3.in" },
  // Gurgaon (122xxx)
  { id:"ca33", name:"CA Radhika Malhotra", city:"Gurgaon",     state:"Haryana",        pincode:"122001", area:"DLF Phase 1",    specialization:"Corporate GST, TDS, ITR",    experience:8,  rating:4.7, reviews:94,  price:3000, verified:true,  languages:["Hindi","English"],             mobile:"9876500033", email:"radhika@camalhotra.in" },
  // Coimbatore (641xxx)
  { id:"ca34", name:"CA Venkat Subramani", city:"Coimbatore",  state:"Tamil Nadu",     pincode:"641001", area:"RS Puram",       specialization:"Manufacturing, GST",         experience:10, rating:4.7, reviews:88,  price:2600, verified:true,  languages:["English","Tamil"],             mobile:"9876500034", email:"venkat@casubramani.in" },
  // Patna (800xxx)
  { id:"ca35", name:"CA Santosh Kumar",    city:"Patna",       state:"Bihar",          pincode:"800001", area:"Fraser Road",    specialization:"GST Filing, ITR",            experience:6,  rating:4.5, reviews:38,  price:1600, verified:false, languages:["Hindi","English"],             mobile:"9876500035", email:"santosh@cakumar2.in" },
];

// ─── PIN CODE → CITY MAPPING ──────────────────────────────────────────────────
// Used to auto-detect city/state from PIN code using India Post API
async function lookupPincode(pin) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data[0]?.Status === "Success") {
      const p = data[0].PostOffice[0];
      return { city: p.District, state: p.State, area: p.Name, valid: true };
    }
    return { valid: false };
  } catch { return { valid: false }; }
}

// ─── CA MARKETPLACE WITH PIN CODE ────────────────────────────────────────────
function CAMarketplace() {
  const [filter, setFilter] = useState({ city:"All", state:"All", specialization:"All", maxPrice:5000, verified:"All" });
  const [pinInput, setPinInput]   = useState("");
  const [pinResult, setPinResult] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError]   = useState("");
  const [search, setSearch]       = useState("");
  const [booked, setBooked]       = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [newCA, setNewCA]         = useState({ name:"", city:"", state:"Maharashtra", pincode:"", area:"", specialization:"", experience:"", price:"", email:"", mobile:"", languages:"Hindi, English" });
  const [registered, setRegistered] = useState(false);
  const [extraCAs, setExtraCAs]   = useState([]);
  const [nearbyRadius, setNearbyRadius] = useState(false);

  const allCAs = [...CA_PROFESSIONALS, ...extraCAs];
  const stateList = ["All", ...new Set(allCAs.map(c=>c.state))].sort();
  const cities = ["All", ...new Set(
    filter.state === "All" ? allCAs.map(c=>c.city) : allCAs.filter(c=>c.state===filter.state).map(c=>c.city)
  )].sort();
  const specs = ["All","GST Filing","GST Audit","ITR","Startup Compliance","E-commerce","Manufacturing GST","Real Estate GST","TDS","Export GST","IT Sector","Pharma","Textile","Litigation"];

  const filtered = allCAs.filter(ca => {
    const matchCity   = filter.city === "All" || ca.city === filter.city;
    const matchState  = filter.state === "All" || ca.state === filter.state;
    const matchSpec   = filter.specialization === "All" || ca.specialization.toLowerCase().includes(filter.specialization.toLowerCase().replace(" filing","").replace(" audit",""));
    const matchVerify = filter.verified === "All" || (filter.verified==="verified" ? ca.verified : !ca.verified);
    const matchPrice  = ca.price <= filter.maxPrice;
    const matchSearch = search === "" || ca.name.toLowerCase().includes(search.toLowerCase()) || ca.city.toLowerCase().includes(search.toLowerCase()) || ca.specialization.toLowerCase().includes(search.toLowerCase()) || (ca.pincode||"").includes(search) || (ca.area||"").toLowerCase().includes(search.toLowerCase());
    // PIN filter: if pinResult active, show only CAs in same city
    const matchPin    = !pinResult || ca.city.toLowerCase() === pinResult.city.toLowerCase() || ca.state.toLowerCase() === pinResult.state.toLowerCase();
    return matchCity && matchState && matchSpec && matchVerify && matchPrice && matchSearch && matchPin;
  });

  async function searchByPin() {
    if (pinInput.length !== 6 || isNaN(pinInput)) { setPinError("Please enter a valid 6-digit PIN code"); return; }
    setPinLoading(true); setPinError(""); setPinResult(null);
    const result = await lookupPincode(pinInput);
    if (result.valid) {
      setPinResult(result);
      setFilter(f => ({ ...f, city:"All", state:"All" }));
    } else {
      setPinError("PIN code not found. Please check and try again.");
    }
    setPinLoading(false);
  }

  function clearPin() { setPinResult(null); setPinInput(""); setPinError(""); }

  // Register new CA
  async function handleRegister() {
    if (!newCA.name || !newCA.city || !newCA.email || !newCA.mobile) return alert("Please fill all required fields marked with *");
    // Auto-fetch area from pincode if provided
    let area = newCA.area;
    if (newCA.pincode.length === 6) {
      const p = await lookupPincode(newCA.pincode);
      if (p.valid) area = p.area;
    }
    const ca = {
      id: "ca_reg_" + Date.now(),
      ...newCA, area,
      experience: Number(newCA.experience) || 1,
      price: Number(newCA.price) || 1500,
      rating: 0, reviews: 0, verified: false,
      languages: newCA.languages.split(",").map(l=>l.trim()),
    };
    setExtraCAs(prev => [...prev, ca]);
    setRegistered(true);
    setTimeout(() => {
      setShowRegister(false); setRegistered(false);
      setNewCA({ name:"", city:"", state:"Maharashtra", pincode:"", area:"", specialization:"", experience:"", price:"", email:"", mobile:"", languages:"Hindi, English" });
    }, 3500);
  }

  // Auto-fill city/state when CA enters their pincode in registration
  async function handleRegisterPinLookup(pin) {
    setNewCA(c => ({ ...c, pincode: pin }));
    if (pin.length === 6) {
      const r = await lookupPincode(pin);
      if (r.valid) setNewCA(c => ({ ...c, city: r.city, state: r.state, area: r.area }));
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800 }}>👨‍💼 CA Marketplace</div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>{allCAs.length} Chartered Accountants across India — search by PIN code or city</div>
        </div>
        <button style={btn("success")} onClick={()=>setShowRegister(true)}>+ Register as CA</button>
      </div>

      {/* ── PIN CODE SEARCH ── */}
      <div style={{ ...card, marginBottom:16, padding:20, background:`linear-gradient(135deg, ${C.primaryLighter}, #fff)`, border:`1.5px solid ${C.primaryLight}40` }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:C.primary }}>📍 Find CAs Near You — Search by PIN Code</div>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={lbl}>Enter Your PIN Code</div>
            <input
              style={{ ...inp, fontSize:18, letterSpacing:4, fontWeight:700, textAlign:"center" }}
              placeholder="452001"
              maxLength={6}
              value={pinInput}
              onChange={e => { setPinInput(e.target.value.replace(/\D/g,"")); setPinError(""); }}
              onKeyDown={e => e.key==="Enter" && searchByPin()}
            />
          </div>
          <div>
            <button style={{ ...btn(), padding:"11px 24px", fontSize:14 }} onClick={searchByPin} disabled={pinLoading}>
              {pinLoading ? "🔍 Searching…" : "🔍 Find CAs"}
            </button>
          </div>
          {pinResult && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:C.successLight, borderRadius:8, border:`1px solid ${C.success}40` }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:C.success }}>✅ {pinResult.area}, {pinResult.city}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{pinResult.state} — Showing CAs in {pinResult.city}</div>
              </div>
              <button onClick={clearPin} style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:18, marginLeft:4 }}>✕</button>
            </div>
          )}
          {pinError && <div style={{ color:C.danger, fontSize:13, fontWeight:600 }}>⚠️ {pinError}</div>}
        </div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:8 }}>
          💡 Try: <span style={{ cursor:"pointer", color:C.primary, fontWeight:600 }} onClick={()=>{setPinInput("452001"); setTimeout(searchByPin,100);}}>452001</span> (Indore) •
          <span style={{ cursor:"pointer", color:C.primary, fontWeight:600, marginLeft:4 }} onClick={()=>{setPinInput("400001"); setTimeout(searchByPin,100);}}>400001</span> (Mumbai) •
          <span style={{ cursor:"pointer", color:C.primary, fontWeight:600, marginLeft:4 }} onClick={()=>{setPinInput("110001"); setTimeout(searchByPin,100);}}>110001</span> (Delhi) •
          <span style={{ cursor:"pointer", color:C.primary, fontWeight:600, marginLeft:4 }} onClick={()=>{setPinInput("560001"); setTimeout(searchByPin,100);}}>560001</span> (Bangalore)
        </div>
      </div>

      {/* Text Search */}
      <div style={{ marginBottom:14 }}>
        <input style={{ ...inp, padding:"11px 16px", fontSize:14, borderRadius:10 }} placeholder="🔍 Search by name, city, area, or specialization…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom:20, padding:14 }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:130 }}>
            <div style={lbl}>State</div>
            <select style={inp} value={filter.state} onChange={e=>setFilter({...filter,state:e.target.value,city:"All"})}>
              {stateList.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex:1, minWidth:130 }}>
            <div style={lbl}>City</div>
            <select style={inp} value={filter.city} onChange={e=>setFilter({...filter,city:e.target.value})}>
              {cities.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex:2, minWidth:160 }}>
            <div style={lbl}>Specialization</div>
            <select style={inp} value={filter.specialization} onChange={e=>setFilter({...filter,specialization:e.target.value})}>
              {specs.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex:1, minWidth:110 }}>
            <div style={lbl}>Status</div>
            <select style={inp} value={filter.verified} onChange={e=>setFilter({...filter,verified:e.target.value})}>
              <option value="All">All CAs</option>
              <option value="verified">✓ Verified</option>
              <option value="new">New CAs</option>
            </select>
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <div style={lbl}>Max ₹{filter.maxPrice.toLocaleString("en-IN")}/mo</div>
            <input type="range" min={500} max={5000} step={500} value={filter.maxPrice} onChange={e=>setFilter({...filter,maxPrice:Number(e.target.value)})} style={{ width:"100%" }} />
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:C.primary, paddingBottom:6, whiteSpace:"nowrap" }}>{filtered.length} CAs found</div>
        </div>
      </div>

      {/* CA Grid */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign:"center", padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😔</div>
          <div style={{ fontWeight:700, fontSize:16 }}>No CAs found in this area</div>
          <div style={{ color:C.textMuted, marginTop:8, marginBottom:16 }}>Try a nearby PIN code or different filters</div>
          <button style={btn()} onClick={()=>setShowRegister(true)}>+ Be the first CA in this area</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {filtered.map(ca => (
            <div key={ca.id} style={{ ...card, padding:20, transition:"all 0.2s", border:`1.5px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:800, fontSize:18, flexShrink:0 }}>
                    {ca.name.split(" ")[1]?.[0] || "C"}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, lineHeight:1.3 }}>{ca.name}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>📍 {ca.area ? `${ca.area}, ` : ""}{ca.city}</div>
                    {ca.pincode && <div style={{ fontSize:10, color:C.primaryLight, fontWeight:600 }}>PIN: {ca.pincode}</div>}
                  </div>
                </div>
                {ca.verified ? <span style={badge(C.success)}>✓ Verified</span> : <span style={badge(C.textMuted)}>New</span>}
              </div>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>🎯 {ca.specialization}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                {ca.languages.map(l=><span key={l} style={{ ...badge(C.primaryLight), fontSize:10 }}>{l}</span>)}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div>
                  <span style={{ fontSize:15, fontWeight:800, color:C.primary }}>₹{ca.price.toLocaleString("en-IN")}</span>
                  <span style={{ fontSize:11, color:C.textMuted }}>/month</span>
                </div>
                <div style={{ fontSize:12 }}>
                  {ca.rating > 0 ? <>⭐ {ca.rating} <span style={{ color:C.textMuted }}>({ca.reviews})</span></> : <span style={{ color:C.textMuted, fontSize:11 }}>No reviews yet</span>}
                </div>
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:12 }}>{ca.experience} yrs exp • {ca.experience > 10 ? "Senior CA" : ca.experience > 5 ? "Experienced" : "Junior CA"}</div>
              <button style={{ ...btn(), width:"100%", justifyContent:"center", fontSize:12 }} onClick={()=>setBooked(ca)}>
                📅 Book Consultation
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CA REGISTRATION MODAL ── */}
      {showRegister && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:20 }}>
          <div style={{ ...card, width:580, padding:32, maxHeight:"92vh", overflowY:"auto" }}>
            {registered ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ fontSize:60 }}>🎉</div>
                <div style={{ fontWeight:800, fontSize:20, marginTop:12, color:C.success }}>Registration Successful!</div>
                <div style={{ color:C.textMuted, marginTop:10, lineHeight:1.7 }}>
                  Your profile is now <strong>live</strong> on CA Marketplace.<br/>
                  Our team will verify your ICAI membership within <strong>24 hours</strong>.<br/>
                  Clients in your PIN code area can now find and book you!
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontWeight:800, fontSize:18, color:C.primary, marginBottom:4 }}>📋 Register as CA on TaxSaathi</div>
                <div style={{ color:C.textMuted, fontSize:13, marginBottom:20 }}>Get discovered by clients in YOUR PIN code area — 10% commission on bookings only</div>

                {/* PIN CODE auto-fill */}
                <div style={{ background:C.primaryLighter, borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.primary, marginBottom:8 }}>📍 Enter Your Office PIN Code — We'll auto-fill your city!</div>
                  <div style={{ display:"flex", gap:10 }}>
                    <input style={{ ...inp, letterSpacing:4, fontWeight:700, textAlign:"center", fontSize:16, flex:1 }} placeholder="452001" maxLength={6} value={newCA.pincode} onChange={e=>handleRegisterPinLookup(e.target.value.replace(/\D/g,""))} />
                    {newCA.city && <div style={{ display:"flex", alignItems:"center", padding:"0 14px", background:C.successLight, borderRadius:7, color:C.success, fontWeight:700, fontSize:13, whiteSpace:"nowrap" }}>✅ {newCA.area}, {newCA.city}</div>}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div><div style={lbl}>Full Name *</div><input style={inp} placeholder="CA Firstname Lastname" value={newCA.name} onChange={e=>setNewCA({...newCA,name:e.target.value})} /></div>
                  <div><div style={lbl}>ICAI Membership No. *</div><input style={inp} placeholder="e.g. 123456" /></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div><div style={lbl}>City *</div><input style={inp} value={newCA.city} onChange={e=>setNewCA({...newCA,city:e.target.value})} placeholder="Auto-filled from PIN" /></div>
                  <div><div style={lbl}>State</div><input style={inp} value={newCA.state} onChange={e=>setNewCA({...newCA,state:e.target.value})} placeholder="Auto-filled from PIN" /></div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={lbl}>Specialization *</div>
                  <input style={inp} placeholder="e.g. GST Filing, ITR, TDS, Real Estate GST" value={newCA.specialization} onChange={e=>setNewCA({...newCA,specialization:e.target.value})} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div><div style={lbl}>Years of Experience *</div><input style={inp} type="number" min={1} placeholder="5" value={newCA.experience} onChange={e=>setNewCA({...newCA,experience:e.target.value})} /></div>
                  <div><div style={lbl}>Monthly Fee (₹) *</div><input style={inp} type="number" placeholder="2000" value={newCA.price} onChange={e=>setNewCA({...newCA,price:e.target.value})} /></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div><div style={lbl}>Email *</div><input style={inp} placeholder="ca@example.in" value={newCA.email} onChange={e=>setNewCA({...newCA,email:e.target.value})} /></div>
                  <div><div style={lbl}>Mobile *</div><input style={inp} placeholder="98765 43210" value={newCA.mobile} onChange={e=>setNewCA({...newCA,mobile:e.target.value})} /></div>
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={lbl}>Languages (comma separated)</div>
                  <input style={inp} placeholder="Hindi, English, Gujarati" value={newCA.languages} onChange={e=>setNewCA({...newCA,languages:e.target.value})} />
                </div>
                <div style={{ background:"#FFF9E6", borderRadius:8, padding:"12px 16px", fontSize:12, marginBottom:20, lineHeight:1.8 }}>
                  ✅ Profile visible immediately after submission<br/>
                  🔍 ICAI verification = "Verified" badge within 24 hrs<br/>
                  📍 Clients searching your PIN code will find you first<br/>
                  💰 No upfront cost — 10% commission on confirmed bookings only
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button style={{ ...btn("success"), flex:1, justifyContent:"center", padding:"12px" }} onClick={handleRegister}>
                    ✅ Submit Registration
                  </button>
                  <button style={{ ...btn("outline"), padding:"12px 20px" }} onClick={()=>setShowRegister(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BOOKING MODAL ── */}
      {booked && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div style={{ ...card, width:500, padding:32 }}>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>📅 Book Consultation</div>
            <div style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 16px", background:C.primaryLighter, borderRadius:8, marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:800, fontSize:18 }}>{booked.name.split(" ")[1]?.[0]||"C"}</div>
              <div>
                <div style={{ fontWeight:700 }}>{booked.name}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>📍 {booked.area ? `${booked.area}, ` : ""}{booked.city} (PIN: {booked.pincode||"—"}) • {booked.experience} yrs exp</div>
                <div style={{ fontSize:13, color:C.primary, fontWeight:600 }}>₹{booked.price.toLocaleString("en-IN")}/month</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div><div style={lbl}>Preferred Date</div><input style={inp} type="date" defaultValue={new Date().toISOString().slice(0,10)} /></div>
              <div><div style={lbl}>Time Slot</div>
                <select style={inp}><option>10:00 AM</option><option>11:00 AM</option><option>12:00 PM</option><option>2:00 PM</option><option>3:00 PM</option><option>4:00 PM</option><option>6:00 PM</option></select>
              </div>
            </div>
            <div style={{ marginBottom:14 }}><div style={lbl}>Mode</div>
              <select style={inp}><option>Video Call (Google Meet)</option><option>Phone Call</option><option>WhatsApp Call</option><option>In-person Visit</option></select>
            </div>
            <div style={{ marginBottom:20 }}><div style={lbl}>Your requirement</div>
              <textarea style={{...inp,height:80,resize:"none"}} placeholder="e.g. GSTR-1 pending for 3 months, need urgent help with filing…" />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...btn("success"), flex:1, justifyContent:"center" }} onClick={()=>{ alert(`✅ Booking confirmed with ${booked.name}!\n\n📧 Email: ${booked.email}\n📱 WhatsApp: ${booked.mobile}\n📍 Area: ${booked.area||booked.city}\n\nYou will receive a confirmation shortly.`); setBooked(null); }}>
                ✅ Confirm Booking
              </button>
              <button style={{ ...btn("outline"), padding:"9px 16px" }} onClick={()=>setBooked(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── useAuth ──────────────────────────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setCompanies([]); setActiveCompany(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    const { data: p } = await supabase.from("users").select("*").eq("id", uid).single();
    const { data: c } = await supabase.from("companies").select("*").eq("user_id", uid);
    setProfile(p);
    const cos = c || [];
    setCompanies(cos);
    setActiveCompany(cos[0] || null);
    setPlan(p?.plan || "free");
    setLoading(false);
  }

  async function signUp({ name, email, mobile, companyName, gstin, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    await supabase.from("users").insert({ id: data.user.id, name, email, mobile, plan: "free" });
    await supabase.from("companies").insert({ user_id: data.user.id, company_name: companyName, gstin: gstin.toUpperCase() });
    return data;
  }
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() { await supabase.auth.signOut(); }
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
  async function addCompany(vals) {
    const { data } = await supabase.from("companies").insert({ user_id: user.id, ...vals }).select().single();
    setCompanies(c => [...c, data]);
  }
  async function updateProfile(vals) {
    await supabase.from("users").update(vals).eq("id", user.id);
    setProfile(p => ({ ...p, ...vals }));
  }
  async function updateCompany(vals) {
    await supabase.from("companies").update(vals).eq("id", activeCompany?.id);
    setCompanies(c => c.map(co => co.id === activeCompany?.id ? { ...co, ...vals } : co));
    setActiveCompany(c => ({ ...c, ...vals }));
  }
  async function upgradePlan(planId) {
    await supabase.from("users").update({ plan: planId }).eq("id", user.id);
    setPlan(planId);
  }
  return { user, profile, companies, activeCompany, setActiveCompany, loading, plan, signUp, signIn, signOut, resetPassword, addCompany, updateProfile, updateCompany, upgradePlan };
}

// ─── useData ──────────────────────────────────────────────────────────────────
function useData(companyId) {
  const [sales, setSales] = useState(MOCK_SALES);
  const [purchases, setPurchases] = useState(MOCK_PURCHASES);
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [invoices, setInvoices] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from("sales_invoices").select("*").eq("company_id", companyId);
    if (data?.length) setSales(data);
  }, [companyId]);

  const fetchPurchases = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from("purchase_invoices").select("*").eq("company_id", companyId);
    if (data?.length) setPurchases(data);
  }, [companyId]);

  const fetchClients = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from("clients").select("*").eq("user_id", companyId);
    if (data?.length) setClients(data);
  }, [companyId]);

  const fetchInvoices = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from("gst_invoices").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (data?.length) setInvoices(data);
  }, [companyId]);

  useEffect(() => {
    if (companyId) { fetchSales(); fetchPurchases(); fetchClients(); fetchInvoices(); }
  }, [companyId, fetchSales, fetchPurchases, fetchClients, fetchInvoices]);

  async function uploadExcel(file, type) {
    if (!companyId) throw new Error("No company found.");
    setUploading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      if (!rows.length) throw new Error("File is empty.");
      const norm = obj => { const o = {}; for (const k of Object.keys(obj)) o[k.toLowerCase().trim().replace(/\s+/g,"_")] = obj[k]; return o; };
      if (type === "sales") {
        const records = rows.map(r => {
          const d = norm(r);
          const taxable = Number(d.taxable_value||d.taxable||0), cgst=Number(d.cgst||0), sgst=Number(d.sgst||0), igst=Number(d.igst||0);
          let dt = d.invoice_date||d.date||new Date().toISOString().slice(0,10);
          if (dt instanceof Date) dt = dt.toISOString().slice(0,10); else dt = String(dt).slice(0,10);
          return { company_id:companyId, invoice_number:String(d.invoice_no||d.invoice_number||"INV-"+Math.random().toString(36).slice(2,7).toUpperCase()), invoice_date:dt, customer_name:String(d.customer_name||d.customer||"Unknown"), gstin:String(d.gstin||""), hsn:String(d.hsn||""), taxable_value:taxable, gst_rate:Number(d.gst_rate||d.rate||0), cgst, sgst, igst, total_value:Number(d.total_value||d.total||(taxable+cgst+sgst+igst)) };
        });
        const { error } = await supabase.from("sales_invoices").insert(records);
        if (error) throw new Error(error.message);
        await fetchSales();
        return { count: records.length };
      } else {
        const records = rows.map(r => {
          const d = norm(r);
          const taxable = Number(d.taxable_value||d.taxable||0), cgst=Number(d.cgst||0), sgst=Number(d.sgst||0), igst=Number(d.igst||0);
          let dt = d.bill_date||d.date||new Date().toISOString().slice(0,10);
          if (dt instanceof Date) dt = dt.toISOString().slice(0,10); else dt = String(dt).slice(0,10);
          return { company_id:companyId, bill_number:String(d.bill_no||d.bill_number||"BILL-"+Math.random().toString(36).slice(2,7).toUpperCase()), bill_date:dt, supplier_name:String(d.supplier_name||d.supplier||"Unknown"), gstin:String(d.gstin||""), hsn:String(d.hsn||""), taxable_value:taxable, gst_rate:Number(d.gst_rate||d.rate||0), cgst, sgst, igst, total_value:Number(d.total_value||d.total||(taxable+cgst+sgst+igst)) };
        });
        const { error } = await supabase.from("purchase_invoices").insert(records);
        if (error) throw new Error(error.message);
        await fetchPurchases();
        return { count: records.length };
      }
    } finally { setUploading(false); }
  }

  async function saveInvoice(inv) {
    const { data, error } = await supabase.from("gst_invoices").insert({ ...inv, company_id: companyId }).select().single();
    if (error) throw new Error(error.message);
    setInvoices(i => [data || inv, ...i]);
    return data || inv;
  }

  function computeSummary() {
    const sum = (arr, f) => arr.reduce((a,r) => a + Number(r[f]||0), 0);
    const cgst = sum(sales,"cgst"), sgst = sum(sales,"sgst"), igst = sum(sales,"igst");
    const itc = sum(purchases,"cgst")+sum(purchases,"sgst")+sum(purchases,"igst");
    return { totalSales:sum(sales,"taxable_value"), totalPurchase:sum(purchases,"taxable_value"), cgstTotal:cgst, sgstTotal:sgst, igstTotal:igst, itcAvailable:itc, netTaxPayable:(cgst+sgst+igst)-itc };
  }

  async function addClient(data) {
    const { data: d } = await supabase.from("clients").insert(data).select().single();
    setClients(c => [...c, d || { id: Math.random().toString(36).slice(2), ...data }]);
  }

  return { sales, purchases, clients, invoices, uploading, uploadExcel, saveInvoice, computeSummary, addClient };
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin, onSignup, onReset }) {
  const [mode, setMode] = useState("login");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name:"", email:"", mobile:"", company:"", gstin:"", password:"" });
  const handle = e => setF({ ...f, [e.target.name]: e.target.value });

  async function submit() {
    setErr(""); setBusy(true);
    try {
      if (mode === "forgot") { await onReset(f.email); setDone(true); }
      else if (mode === "signup") await onSignup({ name:f.name, email:f.email, mobile:f.mobile, companyName:f.company, gstin:f.gstin, password:f.password });
      else await onLogin({ email:f.email, password:f.password });
    } catch(e) { setErr(e.message || "Something went wrong"); }
    setBusy(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${C.sidebar} 0%, ${C.primary} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.white, borderRadius:16, padding:"40px 44px", width:"100%", maxWidth:520, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:34, fontWeight:900, color:C.primary }}>🇮🇳 TaxSaathi 2.0</div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>India's Most Advanced GST Compliance Platform</div>
        </div>
        {done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Reset Email Sent!</div>
            <button style={{ ...btn(), width:"100%", justifyContent:"center" }} onClick={() => { setMode("login"); setDone(false); }}>Back to Login</button>
          </div>
        ) : (
          <>
            {mode !== "forgot" && (
              <div style={{ display:"flex", marginBottom:24, borderRadius:8, overflow:"hidden", border:`1.5px solid ${C.border}` }}>
                {["login","signup"].map(m => (
                  <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex:1, padding:"10px", background:mode===m?C.primary:"transparent", color:mode===m?C.white:C.textMuted, border:"none", fontWeight:600, fontSize:14, cursor:"pointer" }}>
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            )}
            {mode === "signup" && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div><div style={lbl}>Full Name</div><input style={inp} name="name" placeholder="Rajesh Kumar" onChange={handle} /></div>
                  <div><div style={lbl}>Email</div><input style={inp} name="email" placeholder="you@company.com" onChange={handle} /></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div><div style={lbl}>Mobile</div><input style={inp} name="mobile" placeholder="+91 98765 43210" onChange={handle} /></div>
                  <div><div style={lbl}>Company Name</div><input style={inp} name="company" placeholder="XYZ Pvt Ltd" onChange={handle} /></div>
                </div>
                <div style={{ marginBottom:14 }}><div style={lbl}>GSTIN</div><input style={inp} name="gstin" placeholder="27AABCU9603R1ZX" onChange={handle} /></div>
              </>
            )}
            {(mode === "login" || mode === "forgot") && (
              <div style={{ marginBottom:14 }}><div style={lbl}>Email</div><input style={inp} name="email" placeholder="you@company.com" onChange={handle} /></div>
            )}
            {mode !== "forgot" && (
              <div style={{ marginBottom:20 }}>
                <div style={lbl}>Password</div>
                <div style={{ position:"relative" }}>
                  <input style={{ ...inp, paddingRight:44 }} name="password" type={show?"text":"password"} placeholder="••••••••" onChange={handle} />
                  <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", cursor:"pointer", color:C.textMuted, fontSize:13 }} onClick={() => setShow(!show)}>{show?"Hide":"Show"}</span>
                </div>
                {mode === "login" && <div style={{ textAlign:"right", marginTop:6 }}><span style={{ fontSize:12, color:C.primaryLight, cursor:"pointer" }} onClick={() => setMode("forgot")}>Forgot Password?</span></div>}
              </div>
            )}
            {err && <div style={{ background:"#FDEDEC", border:`1px solid ${C.danger}40`, borderRadius:7, padding:"10px 14px", fontSize:13, color:C.danger, marginBottom:14 }}>⚠️ {err}</div>}
            <button style={{ ...btn(), width:"100%", justifyContent:"center", padding:"12px", fontSize:15 }} onClick={submit} disabled={busy}>
              {busy ? "Please wait…" : mode==="login" ? "Sign In →" : mode==="signup" ? "Create Free Account →" : "Send Reset Link"}
            </button>
            {mode !== "forgot" && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
                  <div style={{ flex:1, height:1, background:C.border }} />
                  <span style={{ fontSize:12, color:C.textMuted }}>OR</span>
                  <div style={{ flex:1, height:1, background:C.border }} />
                </div>
                <button onClick={()=>supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:window.location.origin }})} style={{ width:"100%", padding:"11px", borderRadius:7, border:`1.5px solid ${C.border}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontSize:14, fontWeight:600, color:C.text }}>
                  <span style={{ fontWeight:900, color:"#4285F4", fontSize:16 }}>G</span> Continue with Google
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── INVOICE GENERATOR ────────────────────────────────────────────────────────
function InvoiceGenerator({ company, clients, saveInvoice }) {
  const emptyLine = () => ({ description:"", hsn:"", qty:1, unit:"Nos", rate:0, gst_rate:18, amount:0, cgst:0, sgst:0, igst:0, total:0 });
  const [inv, setInv] = useState({
    invoice_number: "INV-" + Date.now().toString().slice(-6),
    invoice_date: new Date().toISOString().slice(0,10),
    due_date: new Date(Date.now()+30*864e5).toISOString().slice(0,10),
    place_of_supply: company?.state || "Maharashtra",
    customer_name:"", customer_gstin:"", customer_address:"", customer_state:"Maharashtra",
    notes:"Thank you for your business!", terms:"Payment due within 30 days.",
    lines: [emptyLine()],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  const isInterstate = inv.customer_state !== (company?.state || "Maharashtra");

  function updateLine(i, field, val) {
    const lines = [...inv.lines];
    lines[i] = { ...lines[i], [field]: val };
    const l = lines[i];
    const taxable = Number(l.qty || 0) * Number(l.rate || 0);
    const rate = Number(l.gst_rate || 0);
    if (isInterstate) {
      lines[i].igst = +(taxable * rate / 100).toFixed(2);
      lines[i].cgst = 0; lines[i].sgst = 0;
    } else {
      lines[i].cgst = +(taxable * rate / 200).toFixed(2);
      lines[i].sgst = +(taxable * rate / 200).toFixed(2);
      lines[i].igst = 0;
    }
    lines[i].amount = +taxable.toFixed(2);
    lines[i].total = +(taxable + lines[i].cgst + lines[i].sgst + lines[i].igst).toFixed(2);
    setInv({ ...inv, lines });
  }

  const totals = inv.lines.reduce((a, l) => ({
    taxable: a.taxable + Number(l.amount||0),
    cgst: a.cgst + Number(l.cgst||0),
    sgst: a.sgst + Number(l.sgst||0),
    igst: a.igst + Number(l.igst||0),
    total: a.total + Number(l.total||0),
  }), { taxable:0, cgst:0, sgst:0, igst:0, total:0 });

  function numToWords(n) {
    const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const inWords = (num) => {
      if (num === 0) return "";
      if (num < 20) return a[num] + " ";
      if (num < 100) return b[Math.floor(num/10)] + " " + a[num%10] + " ";
      if (num < 1000) return a[Math.floor(num/100)] + " Hundred " + inWords(num%100);
      if (num < 100000) return inWords(Math.floor(num/1000)) + "Thousand " + inWords(num%1000);
      if (num < 10000000) return inWords(Math.floor(num/100000)) + "Lakh " + inWords(num%100000);
      return inWords(Math.floor(num/10000000)) + "Crore " + inWords(num%10000000);
    };
    const [rupees, paise] = String(n.toFixed(2)).split(".");
    return inWords(parseInt(rupees)).trim() + " Rupees" + (parseInt(paise) > 0 ? " and " + inWords(parseInt(paise)).trim() + " Paise" : "") + " Only";
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveInvoice({ ...inv, ...totals, invoice_data: JSON.stringify(inv.lines) });
      setSaved(true);
    } catch(e) { alert("Error: " + e.message); }
    setSaving(false);
  }

  function printInvoice() {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Invoice ${inv.invoice_number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1B4F72; padding-bottom: 15px; }
        .company-name { font-size: 22px; font-weight: 900; color: #1B4F72; }
        .invoice-title { font-size: 28px; font-weight: 900; color: #1B4F72; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #1B4F72; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; }
        .total-row { font-weight: bold; background: #f0f8ff; }
        .grand-total { font-size: 16px; font-weight: 900; background: #1B4F72; color: white; }
        .party-box { border: 1px solid #ddd; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
        .party-label { font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .inwords { background: #f9f9f9; padding: 10px; border-radius: 5px; font-style: italic; margin: 10px 0; }
        .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; display: flex; justify-content: space-between; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="header">
        <div>
          <div class="company-name">🇮🇳 ${company?.company_name || "Your Company"}</div>
          <div>GSTIN: ${company?.gstin || "—"}</div>
          <div>${company?.address || ""}</div>
          <div>${company?.state || ""}</div>
        </div>
        <div style="text-align:right">
          <div class="invoice-title">TAX INVOICE</div>
          <div><strong>Invoice #:</strong> ${inv.invoice_number}</div>
          <div><strong>Date:</strong> ${inv.invoice_date}</div>
          <div><strong>Due Date:</strong> ${inv.due_date}</div>
          <div><strong>Place of Supply:</strong> ${inv.place_of_supply}</div>
        </div>
      </div>
      <div class="grid2">
        <div class="party-box">
          <div class="party-label">Bill To</div>
          <strong>${inv.customer_name}</strong><br>
          GSTIN: ${inv.customer_gstin || "Unregistered"}<br>
          ${inv.customer_address || ""}<br>
          ${inv.customer_state}
        </div>
        <div class="party-box">
          <div class="party-label">From</div>
          <strong>${company?.company_name || "Your Company"}</strong><br>
          GSTIN: ${company?.gstin || "—"}<br>
          ${company?.address || ""}<br>
          ${company?.state || ""}
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Taxable</th><th>GST%</th>${isInterstate ? "<th>IGST</th>" : "<th>CGST</th><th>SGST</th>"}<th>Total</th></tr></thead>
        <tbody>
          ${inv.lines.map((l,i) => `<tr><td>${i+1}</td><td>${l.description}</td><td>${l.hsn}</td><td>${l.qty}</td><td>${l.unit}</td><td>${fmt(l.rate)}</td><td>${fmt(l.amount)}</td><td>${l.gst_rate}%</td>${isInterstate ? `<td>${fmt(l.igst)}</td>` : `<td>${fmt(l.cgst)}</td><td>${fmt(l.sgst)}</td>`}<td>${fmt(l.total)}</td></tr>`).join("")}
        </tbody>
        <tfoot>
          <tr class="total-row"><td colspan="${isInterstate?8:9}" style="text-align:right"><strong>Subtotal</strong></td><td><strong>${fmt(totals.taxable)}</strong></td></tr>
          ${isInterstate ? `<tr class="total-row"><td colspan="8" style="text-align:right">IGST</td><td>${fmt(totals.igst)}</td></tr>` : `<tr class="total-row"><td colspan="9" style="text-align:right">CGST</td><td>${fmt(totals.cgst)}</td></tr><tr class="total-row"><td colspan="9" style="text-align:right">SGST</td><td>${fmt(totals.sgst)}</td></tr>`}
          <tr class="grand-total"><td colspan="${isInterstate?8:9}" style="text-align:right; padding:8px">GRAND TOTAL</td><td style="padding:8px">${fmt(totals.total)}</td></tr>
        </tfoot>
      </table>
      <div class="inwords">Amount in Words: <strong>${numToWords(totals.total)}</strong></div>
      ${inv.notes ? `<p><strong>Notes:</strong> ${inv.notes}</p>` : ""}
      ${inv.terms ? `<p><strong>Terms:</strong> ${inv.terms}</p>` : ""}
      <div class="footer">
        <div><strong>Bank Details:</strong><br>Pay via UPI or Bank Transfer</div>
        <div style="text-align:center"><div style="border-top:1px solid #000; margin-top:40px; padding-top:5px">Authorised Signatory</div></div>
      </div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800 }}>🧾 GST Invoice Generator</div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>Create professional GST-compliant tax invoices</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={btn("outline")} onClick={() => setPreview(!preview)}>{preview ? "✏️ Edit" : "👁 Preview"}</button>
          <button style={btn("success")} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save Invoice"}</button>
          <button style={btn()} onClick={printInvoice}>🖨️ Print / PDF</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* Invoice Details */}
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.primary }}>📋 Invoice Details</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><div style={lbl}>Invoice Number</div><input style={inp} value={inv.invoice_number} onChange={e=>setInv({...inv,invoice_number:e.target.value})} /></div>
            <div><div style={lbl}>Invoice Date</div><input style={inp} type="date" value={inv.invoice_date} onChange={e=>setInv({...inv,invoice_date:e.target.value})} /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><div style={lbl}>Due Date</div><input style={inp} type="date" value={inv.due_date} onChange={e=>setInv({...inv,due_date:e.target.value})} /></div>
            <div><div style={lbl}>Place of Supply</div>
              <select style={inp} value={inv.place_of_supply} onChange={e=>setInv({...inv,place_of_supply:e.target.value})}>
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {isInterstate && <div style={{ marginTop:10, padding:"8px 12px", background:"#FFF3CD", borderRadius:6, fontSize:12, color:C.warning, fontWeight:600 }}>⚡ Interstate supply detected — IGST will be applied</div>}
        </div>

        {/* Customer Details */}
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.primary }}>👤 Bill To</div>
          <div style={{ marginBottom:12 }}>
            <div style={lbl}>Customer Name</div>
            <select style={inp} onChange={e => {
              const cl = clients.find(c=>c.company_name===e.target.value);
              if (cl) setInv({...inv, customer_name:cl.company_name, customer_gstin:cl.gstin||"", customer_state:cl.state||"Maharashtra"});
              else setInv({...inv, customer_name:e.target.value});
            }}>
              <option value="">Select or type new customer</option>
              {clients.map(c=><option key={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><div style={lbl}>Customer Name (manual)</div><input style={inp} value={inv.customer_name} onChange={e=>setInv({...inv,customer_name:e.target.value})} /></div>
            <div><div style={lbl}>GSTIN</div><input style={inp} value={inv.customer_gstin} placeholder="27AABCU9603R1ZX" onChange={e=>setInv({...inv,customer_gstin:e.target.value})} /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><div style={lbl}>State</div>
              <select style={inp} value={inv.customer_state} onChange={e=>setInv({...inv,customer_state:e.target.value})}>
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><div style={lbl}>Address</div><input style={inp} value={inv.customer_address} onChange={e=>setInv({...inv,customer_address:e.target.value})} /></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.primary }}>📦 Items / Services</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr>
                {["#","Description","HSN/SAC","Qty","Unit","Rate (₹)","GST %","Taxable","Tax","Total",""].map(h=><th key={h} style={{...TH,padding:"8px 10px"}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l,i) => (
                <tr key={i}>
                  <td style={{...TD,width:30,color:C.textMuted}}>{i+1}</td>
                  <td style={{...TD,minWidth:180}}><input style={{...inp,padding:"6px 8px",fontSize:12}} value={l.description} placeholder="Product or service" onChange={e=>updateLine(i,"description",e.target.value)} /></td>
                  <td style={{...TD,width:80}}><input style={{...inp,padding:"6px 8px",fontSize:12}} value={l.hsn} placeholder="9983" onChange={e=>updateLine(i,"hsn",e.target.value)} /></td>
                  <td style={{...TD,width:60}}><input style={{...inp,padding:"6px 8px",fontSize:12,textAlign:"right"}} type="number" value={l.qty} onChange={e=>updateLine(i,"qty",e.target.value)} /></td>
                  <td style={{...TD,width:70}}>
                    <select style={{...inp,padding:"6px 8px",fontSize:12}} value={l.unit} onChange={e=>updateLine(i,"unit",e.target.value)}>
                      {["Nos","Kg","Ltr","Mtr","Hrs","Pcs","Box","Set"].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{...TD,width:100}}><input style={{...inp,padding:"6px 8px",fontSize:12,textAlign:"right"}} type="number" value={l.rate} onChange={e=>updateLine(i,"rate",e.target.value)} /></td>
                  <td style={{...TD,width:80}}>
                    <select style={{...inp,padding:"6px 8px",fontSize:12}} value={l.gst_rate} onChange={e=>updateLine(i,"gst_rate",e.target.value)}>
                      {GST_RATES.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{...TD,textAlign:"right",fontWeight:600}}>{fmt(l.amount)}</td>
                  <td style={{...TD,textAlign:"right",color:C.primaryLight}}>{isInterstate ? fmt(l.igst) : fmt(l.cgst+l.sgst)}</td>
                  <td style={{...TD,textAlign:"right",fontWeight:700,color:C.primary}}>{fmt(l.total)}</td>
                  <td style={TD}><button onClick={()=>{const lines=[...inv.lines];lines.splice(i,1);setInv({...inv,lines:lines.length?lines:[emptyLine()]});}} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16}}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={{ ...btn("outline"), marginTop:12, fontSize:12 }} onClick={()=>setInv({...inv,lines:[...inv.lines,emptyLine()]})}>+ Add Line Item</button>

        {/* Totals */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <div style={{ width:320 }}>
            {[
              ["Taxable Amount", fmt(totals.taxable), false],
              ...(isInterstate ? [["IGST", fmt(totals.igst), false]] : [["CGST", fmt(totals.cgst), false],["SGST", fmt(totals.sgst), false]]),
              ["Grand Total", fmt(totals.total), true],
            ].map(([label, val, bold]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:bold?"none":`1px solid ${C.border}`, fontWeight:bold?900:500, fontSize:bold?16:13, color:bold?C.primary:C.text, marginTop:bold?4:0 }}>
                <span>{label}</span><span>{val}</span>
              </div>
            ))}
            <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginTop:8 }}>{numToWords(totals.total)}</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={card}>
          <div style={lbl}>Notes to Customer</div>
          <textarea style={{...inp,height:80,resize:"none"}} value={inv.notes} onChange={e=>setInv({...inv,notes:e.target.value})} />
        </div>
        <div style={card}>
          <div style={lbl}>Terms & Conditions</div>
          <textarea style={{...inp,height:80,resize:"none"}} value={inv.terms} onChange={e=>setInv({...inv,terms:e.target.value})} />
        </div>
      </div>
    </div>
  );
}

// ─── AI TAX ASSISTANT ─────────────────────────────────────────────────────────
function AIAssistant({ summary, company }) {
  const [messages, setMessages] = useState([
    { role:"assistant", content:`Namaste! 🙏 Main TaxSaathi AI hoon — aapka personal GST & Tax expert.\n\nMain inke baare mein madad kar sakta hoon:\n• GST calculations & filing queries\n• ITC claims & reconciliation\n• Invoice & e-way bill guidance\n• Income tax & TDS questions\n• Compliance deadlines\n\nKuch bhi poochein — Hindi ya English mein! 😊` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const QUICK = [
    "How much GST do I owe this month?",
    "GSTR-1 filing deadline kab hai?",
    "ITC claim kaise karein?",
    "E-invoice mandatory hai kya?",
    "GST rate on software services?",
    "Reverse charge mechanism explain karo",
  ];

  async function send(text) {
    const q = text || input.trim();
    if (!q) return;
    setInput("");
    setMessages(m => [...m, { role:"user", content:q }]);
    setLoading(true);
    try {
      const context = `You are TaxSaathi AI — an expert Indian GST and tax assistant. 
      Current user company: ${company?.company_name || "Unknown"}, GSTIN: ${company?.gstin || "Unknown"}, State: ${company?.state || "Unknown"}.
      Financial summary: Total Sales ₹${summary?.totalSales?.toLocaleString("en-IN") || 0}, Total Purchases ₹${summary?.totalPurchase?.toLocaleString("en-IN") || 0}, Net GST Payable ₹${summary?.netTaxPayable?.toLocaleString("en-IN") || 0}, ITC Available ₹${summary?.itcAvailable?.toLocaleString("en-IN") || 0}.
      Answer in a mix of Hindi and English (Hinglish) when appropriate. Be concise, practical, and accurate about Indian GST laws. Current date: ${new Date().toLocaleDateString("en-IN")}.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: context,
          messages:[
            ...messages.filter(m=>m.role!=="assistant"||messages.indexOf(m)>0).map(m=>({ role:m.role, content:m.content })),
            { role:"user", content:q }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, kuch problem ho gayi. Please try again.";
      setMessages(m => [...m, { role:"assistant", content:reply }]);
    } catch(e) {
      setMessages(m => [...m, { role:"assistant", content:"Network error. Please check your connection and try again." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 120px)" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>🤖 AI Tax Assistant</div>
        <div style={{ fontSize:13, color:C.textMuted }}>Powered by Claude AI — Ask anything about GST, ITR, TDS in Hindi or English</div>
      </div>

      {/* Quick questions */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${C.primary}40`, background:C.primaryLighter, fontSize:12, color:C.primary, cursor:"pointer", fontWeight:500 }}>{q}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, padding:"4px 0", marginBottom:16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            {m.role==="assistant" && (
              <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, marginRight:10, marginTop:2 }}>🤖</div>
            )}
            <div style={{ maxWidth:"72%", padding:"12px 16px", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.role==="user"?C.primary:C.white, color:m.role==="user"?C.white:C.text, fontSize:14, lineHeight:1.6, boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:m.role==="assistant"?`1px solid ${C.border}`:"none", whiteSpace:"pre-wrap" }}>
              {m.content}
            </div>
            {m.role==="user" && (
              <div style={{ width:36, height:36, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, marginLeft:10, marginTop:2, color:C.white, fontWeight:700 }}>U</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
            <div style={{ padding:"12px 16px", borderRadius:"16px 16px 16px 4px", background:C.white, border:`1px solid ${C.border}`, display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.primary, animation:`bounce 1s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display:"flex", gap:10, background:C.white, padding:16, borderRadius:12, border:`1.5px solid ${C.border}`, boxShadow:"0 -2px 10px rgba(0,0,0,0.05)" }}>
        <input style={{ ...inp, border:"none", outline:"none", padding:"8px 4px", flex:1, fontSize:14 }} value={input} onChange={e=>setInput(e.target.value)} placeholder="GST ke baare mein kuch bhi poochein… (Hindi ya English)" onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} />
        <button style={{ ...btn(), padding:"10px 20px" }} onClick={() => send()} disabled={loading || !input.trim()}>Send ➤</button>
      </div>
    </div>
  );
}

// ─── CA MARKETPLACE ───────────────────────────────────────────────────────────
// ─── MULTI-COMPANY ────────────────────────────────────────────────────────────
function MultiCompany({ companies, activeCompany, setActiveCompany, addCompany, plan }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ company_name:"", gstin:"", address:"", state:"Maharashtra" });
  const limit = plan==="free"?1:plan==="starter"?3:plan==="pro"?10:999;

  async function save() {
    if (!f.company_name || !f.gstin) return;
    setSaving(true);
    await addCompany(f);
    setSaving(false); setShowAdd(false);
    setF({ company_name:"", gstin:"", address:"", state:"Maharashtra" });
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800 }}>🏢 My Companies</div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>{companies.length} of {limit} GSTINs used — <span style={{ color:C.primary, fontWeight:600 }}>{plan.toUpperCase()} Plan</span></div>
        </div>
        {companies.length < limit ? (
          <button style={btn()} onClick={()=>setShowAdd(!showAdd)}>+ Add Company</button>
        ) : (
          <button style={btn("accent")}>⚡ Upgrade to Add More</button>
        )}
      </div>

      {showAdd && (
        <div style={{ ...card, marginBottom:20, border:`1.5px solid ${C.primary}40`, background:C.primaryLighter }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:C.primary }}>Add New Company / GSTIN</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div><div style={lbl}>Company Name</div><input style={inp} value={f.company_name} onChange={e=>setF({...f,company_name:e.target.value})} placeholder="ABC Pvt Ltd" /></div>
            <div><div style={lbl}>GSTIN</div><input style={inp} value={f.gstin} onChange={e=>setF({...f,gstin:e.target.value.toUpperCase()})} placeholder="27AABCU9603R1ZX" /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            <div><div style={lbl}>Address</div><input style={inp} value={f.address} onChange={e=>setF({...f,address:e.target.value})} /></div>
            <div><div style={lbl}>State</div>
              <select style={inp} value={f.state} onChange={e=>setF({...f,state:e.target.value})}>
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={btn()} onClick={save} disabled={saving}>{saving?"Saving…":"Save Company"}</button>
            <button style={btn("outline")} onClick={()=>setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {companies.map(co => (
          <div key={co.id} style={{ ...card, cursor:"pointer", border:`2px solid ${activeCompany?.id===co.id?C.primary:C.border}`, background:activeCompany?.id===co.id?C.primaryLighter:C.white, transition:"all 0.2s" }} onClick={()=>setActiveCompany(co)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:activeCompany?.id===co.id?C.primary:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏢</div>
              {activeCompany?.id===co.id && <span style={badge(C.primary)}>● Active</span>}
            </div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{co.company_name}</div>
            <div style={{ fontFamily:"monospace", fontSize:12, color:C.textMuted, marginBottom:8 }}>{co.gstin}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>📍 {co.state || "—"}</div>
            {activeCompany?.id !== co.id && (
              <button style={{ ...btn("outline"), marginTop:12, width:"100%", justifyContent:"center", fontSize:12 }} onClick={()=>setActiveCompany(co)}>Switch to This Company</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SUBSCRIPTION / BILLING ───────────────────────────────────────────────────
function Subscription({ plan, upgradePlan }) {
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState("");

  async function handleUpgrade(planId) {
    if (planId === "free" || planId === plan) return;
    setLoading(planId);
    // Razorpay integration
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        const selected = PLANS.find(p=>p.id===planId);
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_YourKeyHere",
          amount: selected.price * 100,
          currency: "INR",
          name: "TaxSaathi",
          description: `${selected.name} Plan — Monthly Subscription`,
          image: "https://via.placeholder.com/50x50/1B4F72/FFFFFF?text=TS",
          handler: async function(response) {
            await upgradePlan(planId);
            setSuccess(`🎉 Successfully upgraded to ${selected.name} Plan! Payment ID: ${response.razorpay_payment_id}`);
            setLoading(null);
          },
          prefill: { name:"TaxSaathi User", email:"user@example.com" },
          theme: { color: "#1B4F72" },
          modal: { ondismiss: () => setLoading(null) }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch(e) {
      // Demo mode fallback
      await upgradePlan(planId);
      const selected = PLANS.find(p=>p.id===planId);
      setSuccess(`✅ Demo: Upgraded to ${selected.name} Plan! (Add Razorpay key to .env to enable real payments)`);
      setLoading(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>💳 Plans & Billing</div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>
          Current plan: <strong style={{ color:C.primary }}>{PLANS.find(p=>p.id===plan)?.name || "Free"}</strong> — Cancel anytime, no hidden fees
        </div>
      </div>

      {success && (
        <div style={{ background:C.successLight, border:`1px solid ${C.success}40`, borderRadius:8, padding:"14px 18px", marginBottom:20, color:C.success, fontWeight:600 }}>{success}</div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {PLANS.map(p => (
          <div key={p.id} style={{ ...card, padding:24, border:`2px solid ${plan===p.id?p.color:p.popular?p.color+"44":C.border}`, position:"relative", background:plan===p.id?p.color+"0a":C.white }}>
            {p.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:p.color, color:C.white, fontSize:11, fontWeight:700, padding:"3px 12px", borderRadius:20 }}>MOST POPULAR</div>}
            {plan===p.id && <div style={{ position:"absolute", top:-12, right:16, background:C.success, color:C.white, fontSize:11, fontWeight:700, padding:"3px 12px", borderRadius:20 }}>✓ CURRENT</div>}
            <div style={{ fontWeight:800, fontSize:16, color:p.color, marginBottom:8 }}>{p.name}</div>
            <div style={{ marginBottom:16 }}>
              <span style={{ fontSize:32, fontWeight:900, color:p.color }}>₹{p.price}</span>
              {p.price > 0 && <span style={{ fontSize:12, color:C.textMuted }}>/month</span>}
              {p.price === 0 && <span style={{ fontSize:12, color:C.textMuted }}> forever</span>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {p.features.map(f => (
                <div key={f} style={{ display:"flex", gap:8, fontSize:12, alignItems:"flex-start" }}>
                  <span style={{ color:C.success, flexShrink:0, marginTop:1 }}>✓</span>
                  <span style={{ color:C.text }}>{f}</span>
                </div>
              ))}
            </div>
            {plan === p.id ? (
              <button style={{ ...btn("outline"), width:"100%", justifyContent:"center", fontSize:12 }} disabled>Current Plan</button>
            ) : p.price === 0 ? (
              <button style={{ ...btn("outline"), width:"100%", justifyContent:"center", fontSize:12 }} onClick={()=>upgradePlan("free")}>Downgrade to Free</button>
            ) : (
              <button style={{ ...btn(), width:"100%", justifyContent:"center", fontSize:12, background:p.color }} onClick={()=>handleUpgrade(p.id)} disabled={loading===p.id}>
                {loading===p.id ? "Processing…" : `Upgrade — ₹${p.price}/mo`}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Feature Comparison */}
      <div style={card}>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>📊 Why TaxSaathi beats Zoho Books</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Feature</th>
                <th style={{...TH,textAlign:"center"}}>TaxSaathi Free</th>
                <th style={{...TH,textAlign:"center",color:C.primary}}>TaxSaathi Pro</th>
                <th style={{...TH,textAlign:"center",color:C.danger}}>Zoho Books</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Unlimited Invoices","✅","✅","❌ (capped at plan limit)"],
                ["AI Tax Assistant","❌","✅ Unlimited","❌ Not available"],
                ["CA Marketplace","❌","✅","❌ Not available"],
                ["Hindi Language UI","🔜","✅","❌ English only"],
                ["Tally/Busy Import","❌","✅","❌ Limited"],
                ["WhatsApp Reminders","❌","✅","❌ Email only"],
                ["GSTR-2B Auto-Reconciliation","✅","✅","💰 Paid add-on"],
                ["Offline Mode","❌","✅","❌"],
                ["Price","₹0","₹799/mo","₹1,799/mo"],
              ].map(([feat,...vals])=>(
                <tr key={feat}>
                  <td style={{...TD,fontWeight:600}}>{feat}</td>
                  {vals.map((v,i)=><td key={i} style={{...TD,textAlign:"center",color:v.startsWith("✅")?C.success:v.startsWith("❌")?C.danger:v.startsWith("💰")?C.warning:C.text}}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ summary, profile, plan }) {
  const { totalSales, totalPurchase, cgstTotal, sgstTotal, igstTotal, itcAvailable, netTaxPayable } = summary;
  const stats = [
    { label:"Total Sales", value:fmt(totalSales), color:C.primary, icon:"📈" },
    { label:"Total Purchases", value:fmt(totalPurchase), color:C.primaryLight, icon:"📉" },
    { label:"GST Collected", value:fmt(cgstTotal+sgstTotal+igstTotal), color:C.accent, icon:"🧾" },
    { label:"ITC Available", value:fmt(itcAvailable), color:C.success, icon:"💰" },
    { label:"Net GST Payable", value:fmt(netTaxPayable), color:C.danger, icon:"⚠️" },
  ];
  return (
    <div>
      <div style={{ marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800 }}>Good Morning, {profile?.name?.split(" ")[0] || "User"} 👋</div>
          <div style={{ fontSize:14, color:C.textMuted, marginTop:4 }}>GST compliance overview for March 2026</div>
        </div>
        <span style={badge(plan==="pro"?C.primary:plan==="starter"?C.primaryLight:plan==="enterprise"?C.purple:C.textMuted)}>
          {plan.toUpperCase()} PLAN
        </span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16, marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ ...card, padding:"18px 20px", borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>{s.label}</div>
              <span style={{ fontSize:20 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>⚡ Quick Actions</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              {label:"Create Invoice",icon:"🧾",color:C.primary},
              {label:"Upload Sales",icon:"📤",color:C.primaryLight},
              {label:"Ask AI Assistant",icon:"🤖",color:C.purple},
              {label:"Find CA",icon:"👨‍💼",color:C.success},
            ].map((a,i) => (
              <button key={i} style={{ padding:"14px", borderRadius:8, background:a.color+"12", border:`1.5px solid ${a.color}30`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{a.icon}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{a.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>⏰ Upcoming Deadlines</div>
          {(() => {
            const today = new Date();
            const deadlines = [];
            for (let i = 0; i < 3; i++) {
              const m = (today.getMonth() + i) % 12;
              const y = today.getMonth() + i >= 12 ? today.getFullYear() + 1 : today.getFullYear();
              const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
              deadlines.push({ task:'GSTR-1 Filing', due:'11 '+mn+' '+y, period:mn+' '+y, color:'#2E86C1', date: new Date(y, m, 11) });
              deadlines.push({ task:'GSTR-3B Filing', due:'20 '+mn+' '+y, period:mn+' '+y, color:'#F39C12', date: new Date(y, m, 20) });
              deadlines.push({ task:'TDS Deposit', due:'7 '+mn+' '+y, period:mn+' '+y, color:'#E67E22', date: new Date(y, m, 7) });
            }
            return deadlines.filter(d => d.date >= today).sort((a,b) => a.date - b.date).slice(0,5).map((c,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", borderRadius:7, background:C.bg, border:`1px solid ${C.border}`, marginBottom:8 }}>
                <div><div style={{ fontSize:13, fontWeight:600 }}>{c.task}</div><div style={{ fontSize:11, color:C.textMuted }}>{c.period}</div></div>
                <span style={badge(c.color)}>Due {c.due}</span>
              </div>
            ));
          })()}
        </div>
      </div>
      <div style={{ ...card, marginTop:20 }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>📊 Monthly GST Overview — FY {new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear()-1}-{(new Date().getMonth() >= 3 ? new Date().getFullYear()+1 : new Date().getFullYear()).toString().slice(2)}</div>
        <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:120 }}>
          {[65,82,54,91,73,88,61,95,78,84,92,100].map((h,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ width:"100%", height:h*1.1, background:i===11?C.primary:C.primary+"55", borderRadius:"4px 4px 0 0", transition:"height 0.5s" }} />
              <div style={{ fontSize:10, color:C.textMuted }}>{["A","M","J","J","A","S","O","N","D","J","F","M"][i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// ─── WHATSAPP NOTIFICATIONS ───────────────────────────────────────────────────
function WhatsAppNotifications({ clients, company }) {
  const today = new Date();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // Generate upcoming deadlines
  const deadlines = [];
  for (let i = 0; i < 3; i++) {
    const m = (today.getMonth() + i) % 12;
    const y = today.getMonth() + i >= 12 ? today.getFullYear() + 1 : today.getFullYear();
    const mn = MONTHS[m].slice(0,3);
    deadlines.push({ task:`GSTR-1 Filing`, date:`11 ${mn} ${y}`, period:`${mn} ${y}`, days: Math.ceil((new Date(y, m, 11) - today) / 86400000) });
    deadlines.push({ task:`GSTR-3B Filing`, date:`20 ${mn} ${y}`, period:`${mn} ${y}`, days: Math.ceil((new Date(y, m, 20) - today) / 86400000) });
    deadlines.push({ task:`TDS Deposit`, date:`7 ${mn} ${y}`, period:`${mn} ${y}`, days: Math.ceil((new Date(y, m, 7) - today) / 86400000) });
  }
  const upcoming = deadlines.filter(d => d.days >= 0 && d.days <= 30).sort((a,b) => a.days - b.days).slice(0,6);

  const [selected, setSelected] = useState({ clients: [], deadline: null });
  const [template, setTemplate] = useState("hindi");
  const [sent, setSent] = useState([]);
  const [sending, setSending] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [tab, setTab] = useState("send");

  const TEMPLATES = {
    hindi: (dl, co) => `🇮🇳 *TaxSaathi Alert*\n\nNamaste! 🙏\n\n*${co?.company_name || "Aapki Company"}* ki taraf se yaad dilana chahte hain:\n\n⚠️ *${dl?.task}* ki deadline nazar aa rahi hai\n📅 Due Date: *${dl?.date}*\n📋 Period: ${dl?.period}\n\n${dl?.days <= 3 ? "🚨 URGENT: Sirf " + dl?.days + " din baaki hain!" : dl?.days <= 7 ? "⏰ " + dl?.days + " din baaki hain" : "✅ " + dl?.days + " din baaki hain"}\n\nJaldi filing karein aur penalty se bachein! 💪\n\n_TaxSaathi — GST Compliance Platform_`,
    english: (dl, co) => `🇮🇳 *TaxSaathi Reminder*\n\nDear Valued Client,\n\nThis is a reminder from *${co?.company_name || "Your CA"}*:\n\n⚠️ *${dl?.task}* deadline is approaching\n📅 Due Date: *${dl?.date}*\n📋 Period: ${dl?.period}\n\n${dl?.days <= 3 ? "🚨 URGENT: Only " + dl?.days + " days remaining!" : "📌 " + dl?.days + " days remaining"}\n\nPlease complete your filing to avoid penalties.\n\n_Powered by TaxSaathi_`,
    custom: () => customMsg,
  };

  function getMsg(dl) {
    return TEMPLATES[template](dl, company);
  }

  function sendWhatsApp(mobile, msg) {
    const encoded = encodeURIComponent(msg);
    const clean = mobile.replace(/\D/g, "");
    const num = clean.startsWith("91") ? clean : "91" + clean;
    window.open(`https://wa.me/${num}?text=${encoded}`, "_blank");
  }

  async function sendBulk() {
    if (!selected.deadline || selected.clients.length === 0) return;
    setSending(true);
    const dl = upcoming.find(d => d.task + d.date === selected.deadline);
    const msg = getMsg(dl);
    for (const c of selected.clients) {
      if (c.mobile) {
        sendWhatsApp(c.mobile, msg);
        await new Promise(r => setTimeout(r, 800));
        setSent(prev => [...prev, { client: c.company_name, task: dl.task, time: new Date().toLocaleTimeString() }]);
      }
    }
    setSending(false);
  }

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>💬 WhatsApp Notifications</div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>Send GST deadline reminders to clients via WhatsApp — one click!</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:"flex", gap:0, marginBottom:20, background:C.white, borderRadius:10, border:`1px solid ${C.border}`, overflow:"hidden", width:"fit-content" }}>
        {[["send","📤 Send Notifications"],["history","📋 Sent History"],["templates","✏️ Templates"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"10px 20px", border:"none", background:tab===id?C.primary:"transparent", color:tab===id?C.white:C.textMuted, fontWeight:tab===id?700:500, fontSize:13, cursor:"pointer" }}>{label}</button>
        ))}
      </div>

      {tab === "send" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {/* Left: Setup */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Step 1: Select Deadline */}
            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.primary }}>Step 1 — Select Deadline to Remind</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {upcoming.map(d => (
                  <div key={d.task+d.date} onClick={() => setSelected(s => ({ ...s, deadline: d.task+d.date }))}
                    style={{ padding:"10px 14px", borderRadius:8, border:`1.5px solid ${selected.deadline===d.task+d.date?C.primary:C.border}`, background:selected.deadline===d.task+d.date?C.primaryLighter:C.white, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{d.task}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>Due: {d.date}</div>
                    </div>
                    <span style={badge(d.days <= 3 ? C.danger : d.days <= 7 ? C.warning : C.success)}>
                      {d.days === 0 ? "Today!" : d.days + "d left"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Template */}
            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:C.primary }}>Step 2 — Message Template</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {[["hindi","हिंदी"],["english","English"],["custom","Custom"]].map(([id,label]) => (
                  <button key={id} onClick={() => setTemplate(id)} style={{ flex:1, padding:"8px", borderRadius:7, border:`1.5px solid ${template===id?C.primary:C.border}`, background:template===id?C.primaryLighter:"transparent", color:template===id?C.primary:C.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{label}</button>
                ))}
              </div>
              {template === "custom" ? (
                <textarea style={{ ...inp, height:120, resize:"none", fontSize:12 }} value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Type your custom WhatsApp message here…" />
              ) : (
                <div style={{ background:C.bg, borderRadius:8, padding:12, fontSize:12, whiteSpace:"pre-wrap", lineHeight:1.6, color:C.text, maxHeight:150, overflowY:"auto" }}>
                  {getMsg(upcoming.find(d => d.task+d.date === selected.deadline) || upcoming[0])}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:C.primary }}>Step 3 — Schedule (Optional)</div>
              <div><div style={lbl}>Send at specific time</div>
                <input style={inp} type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:8 }}>💡 Leave empty to send immediately. Scheduled messages open WhatsApp at the set time.</div>
            </div>
          </div>

          {/* Right: Select Clients + Send */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.primary }}>Step 4 — Select Clients</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ ...btn("outline"), fontSize:11, padding:"5px 10px" }} onClick={() => setSelected(s => ({ ...s, clients: clients }))}>All</button>
                  <button style={{ ...btn("outline"), fontSize:11, padding:"5px 10px" }} onClick={() => setSelected(s => ({ ...s, clients: [] }))}>None</button>
                </div>
              </div>
              {clients.length === 0 ? (
                <div style={{ textAlign:"center", padding:20, color:C.textMuted }}>No clients added yet. Add clients first!</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:280, overflowY:"auto" }}>
                  {clients.map(c => {
                    const isSelected = selected.clients.some(x => x.id === c.id);
                    return (
                      <div key={c.id} onClick={() => setSelected(s => ({ ...s, clients: isSelected ? s.clients.filter(x => x.id !== c.id) : [...s.clients, c] }))}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:`1.5px solid ${isSelected?C.success:C.border}`, background:isSelected?"#EAFAF1":C.white, cursor:"pointer" }}>
                        <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${isSelected?C.success:C.border}`, background:isSelected?C.success:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {isSelected && <span style={{ color:C.white, fontSize:12 }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13 }}>{c.company_name}</div>
                          <div style={{ fontSize:11, color:C.textMuted }}>📱 {c.mobile || "No mobile"} • {c.state}</div>
                        </div>
                        {!c.mobile && <span style={badge(C.warning)}>No Mobile</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send Button */}
            <div style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div><div style={{ fontWeight:700, fontSize:15 }}>Ready to Send</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{selected.clients.length} clients selected • {selected.clients.filter(c=>c.mobile).length} have WhatsApp</div>
                </div>
                <div style={{ fontSize:24 }}>📲</div>
              </div>
              {selected.clients.filter(c=>!c.mobile).length > 0 && (
                <div style={{ background:"#FFF9E6", borderRadius:7, padding:"8px 12px", fontSize:12, color:C.warning, marginBottom:12 }}>
                  ⚠️ {selected.clients.filter(c=>!c.mobile).length} clients have no mobile number — they will be skipped
                </div>
              )}
              <button style={{ ...btn("success"), width:"100%", justifyContent:"center", padding:"13px", fontSize:15 }}
                onClick={sendBulk} disabled={sending || !selected.deadline || selected.clients.filter(c=>c.mobile).length === 0}>
                {sending ? "⏳ Sending…" : `📲 Send WhatsApp to ${selected.clients.filter(c=>c.mobile).length} Clients`}
              </button>
              <div style={{ fontSize:11, color:C.textMuted, textAlign:"center", marginTop:8 }}>Opens WhatsApp Web for each client — confirm send in WhatsApp</div>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>📋 Sent Notifications</div>
          {sent.length === 0 ? (
            <div style={{ textAlign:"center", padding:30, color:C.textMuted }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
              No notifications sent yet this session.
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Client","Deadline","Time","Status"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>{sent.map((s,i) => (
                <tr key={i}>
                  <td style={{ ...TD, fontWeight:600 }}>{s.client}</td>
                  <td style={TD}>{s.task}</td>
                  <td style={TD}>{s.time}</td>
                  <td style={TD}><span style={badge(C.success)}>✓ Sent</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "templates" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {[
            { name:"Hindi Reminder", lang:"हिंदी", desc:"Friendly Hindi message for local clients" },
            { name:"English Reminder", lang:"English", desc:"Professional English message" },
            { name:"Urgent (3 days)", lang:"Hindi+English", desc:"Urgent reminder for last 3 days" },
            { name:"Post-Deadline", lang:"Hindi", desc:"Reminder after deadline has passed" },
          ].map((t,i) => (
            <div key={i} style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{t.name}</div>
                <span style={badge(C.primaryLight)}>{t.lang}</span>
              </div>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:12 }}>{t.desc}</div>
              <div style={{ background:C.bg, borderRadius:7, padding:10, fontSize:11, color:C.text, lineHeight:1.6 }}>
                {i===0 && `🇮🇳 TaxSaathi Alert\n\nNamaste! GSTR-1 filing ki deadline nazar aa rahi hai...\n[Client ka naam], Due: 11 Apr 2025`}
                {i===1 && `🇮🇳 TaxSaathi Reminder\n\nDear Client, GSTR-3B deadline is approaching.\nDue Date: 20 Apr 2025. Please file to avoid penalty.`}
                {i===2 && `🚨 URGENT: Sirf 3 din baaki hain!\n\nGSTR-1 filing abhi karein warna ₹10,000 penalty lagegi!\nCall karo: [CA mobile]`}
                {i===3 && `⚠️ Deadline Miss Ho Gayi!\n\nGSTR-1 ki due date kal thi. Late filing fee lagegi.\nAbhi contact karein: [CA name]`}
              </div>
              <button style={{ ...btn("outline"), marginTop:12, width:"100%", justifyContent:"center", fontSize:12 }}>✏️ Edit Template</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CA ENROLLMENT / PAYMENT ──────────────────────────────────────────────────
function CAEnrollment() {
  const CA_PLANS = [
    { id:"basic",    name:"Basic Listing",   price:999,  period:"year",  color:C.primaryLight, features:["Listed in CA Marketplace","PIN code search visibility","Basic profile page","Up to 10 client bookings/mo","Email support"], popular:false },
    { id:"standard", name:"Standard",        price:2499, period:"year",  color:C.primary,      features:["Everything in Basic","Verified badge (ICAI check)","Priority listing in search","Unlimited bookings","WhatsApp booking alerts","Client reviews & ratings","25% more visibility"], popular:true },
    { id:"premium",  name:"Premium CA",      price:4999, period:"year",  color:C.purple,       features:["Everything in Standard","Top 3 placement in city","Featured CA badge","Dedicated profile page","Direct client calls","Analytics dashboard","Lead generation reports","Priority support"], popular:false },
  ];

  const [selected, setSelected] = useState("standard");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", icai:"", email:"", mobile:"", city:"", state:"Maharashtra", specialization:"", experience:"", pincode:"" });
  const [paying, setPaying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  async function handlePayment() {
    setPaying(true);
    const plan = CA_PLANS.find(p => p.id === selected);
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      await new Promise(r => script.onload = r);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_placeholder",
        amount: plan.price * 100,
        currency: "INR",
        name: "TaxSaathi CA Marketplace",
        description: `${plan.name} Plan — Annual Enrollment`,
        handler: () => { setEnrolled(true); setPaying(false); },
        prefill: { name: form.name, email: form.email, contact: form.mobile },
        theme: { color: "#1B4F72" },
        modal: { ondismiss: () => setPaying(false) }
      };
      new window.Razorpay(options).open();
    } catch {
      // Demo fallback
      await new Promise(r => setTimeout(r, 1500));
      setEnrolled(true);
      setPaying(false);
    }
  }

  if (enrolled) return (
    <div style={{ ...card, textAlign:"center", maxWidth:500, margin:"40px auto", padding:40 }}>
      <div style={{ fontSize:60 }}>🎉</div>
      <div style={{ fontSize:22, fontWeight:900, color:C.success, marginTop:16 }}>Enrollment Successful!</div>
      <div style={{ color:C.textMuted, marginTop:10, lineHeight:1.8 }}>
        Welcome to TaxSaathi CA Network!<br/>
        Your profile will be live within <strong>2 hours</strong>.<br/>
        ICAI verification completes in <strong>24 hours</strong>.
      </div>
      <div style={{ ...card, margin:"20px 0", background:C.primaryLighter, textAlign:"left" }}>
        <div style={{ fontWeight:700, marginBottom:8 }}>📋 What happens next:</div>
        {["Profile goes live on CA Marketplace","Clients in your PIN area can find you","You get WhatsApp alert for each booking","ICAI membership verified within 24hrs","Verified badge added to your profile"].map((s,i) => (
          <div key={i} style={{ fontSize:13, padding:"4px 0", color:C.text }}>✅ {s}</div>
        ))}
      </div>
      <button style={{ ...btn(), padding:"12px 30px" }} onClick={() => { setEnrolled(false); setStep(1); }}>Back to Enrollment</button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>👨‍💼 CA Enrollment & Listing</div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>Join India's fastest growing CA marketplace — get clients directly</div>
      </div>

      {/* Stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"CAs Enrolled", value:"35+", icon:"👨‍💼", color:C.primary },
          { label:"Cities Covered", value:"20+", icon:"📍", color:C.success },
          { label:"Client Bookings", value:"1,200+", icon:"📅", color:C.accent },
          { label:"Avg Monthly Leads", value:"8-15", icon:"📈", color:C.purple },
        ].map((s,i) => (
          <div key={i} style={{ ...card, padding:"16px 20px", borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, textTransform:"uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          {/* Pricing Plans */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
            {CA_PLANS.map(p => (
              <div key={p.id} onClick={() => setSelected(p.id)}
                style={{ ...card, cursor:"pointer", border:`2px solid ${selected===p.id?p.color:C.border}`, background:selected===p.id?p.color+"0a":C.white, position:"relative", transition:"all 0.2s" }}>
                {p.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:p.color, color:C.white, fontSize:11, fontWeight:700, padding:"3px 14px", borderRadius:20 }}>MOST POPULAR</div>}
                <div style={{ fontWeight:800, fontSize:16, color:p.color, marginBottom:6 }}>{p.name}</div>
                <div style={{ marginBottom:16 }}>
                  <span style={{ fontSize:30, fontWeight:900, color:p.color }}>₹{p.price.toLocaleString("en-IN")}</span>
                  <span style={{ fontSize:12, color:C.textMuted }}>/{p.period}</span>
                </div>
                {p.features.map(f => (
                  <div key={f} style={{ display:"flex", gap:8, fontSize:12, padding:"4px 0", alignItems:"flex-start" }}>
                    <span style={{ color:C.success, flexShrink:0 }}>✓</span><span>{f}</span>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:"10px", borderRadius:7, background:selected===p.id?p.color:C.bg, textAlign:"center", color:selected===p.id?C.white:C.textMuted, fontWeight:600, fontSize:13 }}>
                  {selected===p.id ? "✓ Selected" : "Select Plan"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <button style={{ ...btn(), padding:"14px 40px", fontSize:15 }} onClick={() => setStep(2)}>
              Continue with {CA_PLANS.find(p=>p.id===selected)?.name} — ₹{CA_PLANS.find(p=>p.id===selected)?.price.toLocaleString("en-IN")}/yr →
            </button>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:8 }}>✅ No commission on first 3 bookings • Cancel anytime • GST invoice provided</div>
          </div>
        </>
      )}

      {step === 2 && (
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <div style={{ ...card, marginBottom:20, background:C.primaryLighter }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontWeight:700 }}>{CA_PLANS.find(p=>p.id===selected)?.name}</div><div style={{ fontSize:12, color:C.textMuted }}>Annual enrollment fee</div></div>
              <div style={{ fontSize:22, fontWeight:900, color:C.primary }}>₹{CA_PLANS.find(p=>p.id===selected)?.price.toLocaleString("en-IN")}</div>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:C.primary }}>📋 Your CA Profile Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div><div style={lbl}>Full Name *</div><input style={inp} placeholder="CA Firstname Lastname" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
              <div><div style={lbl}>ICAI Membership No. *</div><input style={inp} placeholder="123456" value={form.icai} onChange={e=>setForm({...form,icai:e.target.value})} /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div><div style={lbl}>Email *</div><input style={inp} placeholder="ca@example.in" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
              <div><div style={lbl}>Mobile (WhatsApp) *</div><input style={inp} placeholder="98765 43210" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div><div style={lbl}>PIN Code</div><input style={inp} placeholder="452001" maxLength={6} value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})} /></div>
              <div><div style={lbl}>City *</div><input style={inp} placeholder="Indore" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
            </div>
            <div style={{ marginBottom:14 }}><div style={lbl}>Specialization *</div><input style={inp} placeholder="GST Filing, ITR, TDS" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} /></div>
            <div style={{ marginBottom:20 }}><div style={lbl}>Years of Experience</div><input style={inp} type="number" min={1} placeholder="5" value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})} /></div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...btn("outline") }} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...btn("success"), flex:1, justifyContent:"center", padding:"12px" }} onClick={handlePayment} disabled={paying || !form.name || !form.email || !form.mobile}>
                {paying ? "⏳ Processing Payment…" : `💳 Pay ₹${CA_PLANS.find(p=>p.id===selected)?.price.toLocaleString("en-IN")} & Enroll`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── DARK MODE CONTEXT ────────────────────────────────────────────────────────
const DarkModeContext = React.createContext({ dark: false, toggle: () => {} });

// ─── E-INVOICE GENERATOR ─────────────────────────────────────────────────────
function EInvoice({ company, sales }) {
  const [selected, setSelected] = useState(null);
  const [irn, setIrn] = useState({});
  const [generating, setGenerating] = useState(false);
  const [qr, setQr] = useState({});

  function generateIRN(inv) {
    // Simulates IRN generation (real: call GSTN sandbox API)
    const hash = btoa(`${company?.gstin}|${inv.invoice_number}|${inv.invoice_date}`).slice(0, 64).toUpperCase();
    return hash;
  }

  function generateQR(inv, irnVal) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`IRN:${irnVal}|GSTIN:${company?.gstin}|Inv:${inv.invoice_number}|Date:${inv.invoice_date}|Amt:${inv.total_value}`)}`;
  }

  async function handleGenerate(inv) {
    setGenerating(true);
    setSelected(inv.id);
    await new Promise(r => setTimeout(r, 1500));
    const irnVal = generateIRN(inv);
    const qrUrl = generateQR(inv, irnVal);
    setIrn(prev => ({ ...prev, [inv.id]: irnVal }));
    setQr(prev => ({ ...prev, [inv.id]: qrUrl }));
    setGenerating(false);
  }

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>🧾 E-Invoice Generation</div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>Generate IRN (Invoice Reference Number) as per GSTN guidelines</div>
      </div>

      {/* Info box */}
      <div style={{ ...card, marginBottom:20, background:"#EBF5FB", border:`1px solid ${C.primaryLight}40` }}>
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ fontSize:32 }}>ℹ️</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>E-Invoice is mandatory for businesses with turnover above ₹5 Crore</div>
            <div style={{ fontSize:13, color:C.textMuted, lineHeight:1.7 }}>
              • IRN is a unique 64-character hash generated by the GSTN portal<br/>
              • QR code must be printed on every B2B invoice<br/>
              • E-invoice must be generated before or at the time of issuing invoice
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Invoice List */}
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.primary }}>Select Invoice to Generate IRN</div>
          {sales.length === 0 ? (
            <div style={{ textAlign:"center", padding:30, color:C.textMuted }}>No invoices found. Create invoices first!</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:400, overflowY:"auto" }}>
              {sales.map(inv => (
                <div key={inv.id} style={{ padding:"12px 14px", borderRadius:8, border:`1.5px solid ${selected===inv.id?C.primary:C.border}`, background:selected===inv.id?C.primaryLighter:C.white, cursor:"pointer" }} onClick={() => setSelected(inv.id)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{inv.invoice_number}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{inv.customer_name} • {inv.invoice_date}</div>
                      <div style={{ fontSize:12, color:C.primary, fontWeight:600 }}>{fmt(inv.total_value)}</div>
                    </div>
                    <div>
                      {irn[inv.id] ? (
                        <span style={badge(C.success)}>✓ IRN Generated</span>
                      ) : (
                        <button style={{ ...btn(), fontSize:11, padding:"6px 12px" }} onClick={e => { e.stopPropagation(); handleGenerate(inv); }} disabled={generating && selected===inv.id}>
                          {generating && selected===inv.id ? "⏳ Generating…" : "Generate IRN"}
                        </button>
                      )}
                    </div>
                  </div>
                  {irn[inv.id] && (
                    <div style={{ marginTop:8, padding:"8px 10px", background:C.bg, borderRadius:6, fontSize:10, fontFamily:"monospace", color:C.textMuted, wordBreak:"break-all" }}>
                      IRN: {irn[inv.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IRN + QR Display */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {selected && irn[selected] ? (
            <>
              <div style={card}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.success }}>✅ IRN Generated Successfully!</div>
                <div style={{ marginBottom:12 }}>
                  <div style={lbl}>Invoice Reference Number (IRN)</div>
                  <div style={{ background:C.bg, padding:"10px 12px", borderRadius:7, fontFamily:"monospace", fontSize:11, wordBreak:"break-all", border:`1px solid ${C.border}` }}>{irn[selected]}</div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button style={{ ...btn(), fontSize:12 }} onClick={() => navigator.clipboard.writeText(irn[selected])}>📋 Copy IRN</button>
                  <button style={{ ...btn("outline"), fontSize:12 }} onClick={() => window.print()}>🖨️ Print with QR</button>
                </div>
              </div>
              {qr[selected] && (
                <div style={{ ...card, textAlign:"center" }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📱 QR Code for Invoice</div>
                  <img src={qr[selected]} alt="QR Code" style={{ width:150, height:150, border:`2px solid ${C.border}`, borderRadius:8, padding:8 }} />
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:10 }}>Print this QR on your invoice as per GSTN requirement</div>
                  <a href={qr[selected]} download="qr_code.png">
                    <button style={{ ...btn("outline"), marginTop:10, fontSize:12, width:"100%", justifyContent:"center" }}>⬇️ Download QR Code</button>
                  </a>
                </div>
              )}
            </>
          ) : (
            <div style={{ ...card, textAlign:"center", padding:40 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🧾</div>
              <div style={{ fontWeight:700, fontSize:15 }}>Select an invoice and generate IRN</div>
              <div style={{ fontSize:13, color:C.textMuted, marginTop:8 }}>QR code will appear here after generation</div>
            </div>
          )}

          {/* E-Invoice Steps */}
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📋 E-Invoice Process</div>
            {[
              { step:1, label:"Create Invoice", desc:"Generate GST invoice in TaxSaathi", done:true },
              { step:2, label:"Generate IRN", desc:"Get unique reference number from GSTN", done:!!irn[selected] },
              { step:3, label:"Print QR Code", desc:"Add QR to invoice before sending", done:false },
              { step:4, label:"Send to Buyer", desc:"Share e-invoice with buyer", done:false },
            ].map(s => (
              <div key={s.step} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:s.done?C.success:C.bg, border:`2px solid ${s.done?C.success:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:12, color:s.done?C.white:C.textMuted, fontWeight:700 }}>{s.done?"✓":s.step}</span>
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── E-WAY BILL ───────────────────────────────────────────────────────────────
function EWayBill({ company, sales }) {
  const [form, setForm] = useState({
    invoice_id:"", supply_type:"Outward", sub_type:"Supply",
    doc_type:"Tax Invoice", transport_mode:"Road",
    vehicle_no:"", transporter_id:"", distance:0,
    from_gstin: company?.gstin || "", from_name: company?.company_name || "", from_pincode: company?.pincode || "",
    to_gstin:"", to_name:"", to_pincode:"",
  });
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!form.invoice_id || !form.to_gstin || !form.distance) return alert("Please fill all required fields");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerated({
      ewb_no: "EWB" + Date.now().toString().slice(-10),
      ewb_date: new Date().toLocaleDateString("en-IN"),
      valid_till: new Date(Date.now() + form.distance * 36e5).toLocaleDateString("en-IN"),
      ...form,
    });
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>🚚 E-Way Bill Generation</div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>Generate e-way bill for goods movement above ₹50,000</div>
      </div>

      {generated ? (
        <div>
          <div style={{ ...card, background:C.successLight, border:`1.5px solid ${C.success}40`, marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:C.success }}>✅ E-Way Bill Generated!</div>
                <div style={{ fontSize:14, color:C.text, marginTop:8 }}>
                  <strong>EWB No:</strong> <span style={{ fontFamily:"monospace", background:C.white, padding:"2px 8px", borderRadius:5 }}>{generated.ewb_no}</span>
                </div>
                <div style={{ fontSize:13, color:C.textMuted, marginTop:6 }}>Generated: {generated.ewb_date} • Valid till: {generated.valid_till}</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...btn(), fontSize:12 }} onClick={() => window.print()}>🖨️ Print</button>
                <button style={{ ...btn("outline"), fontSize:12 }} onClick={() => setGenerated(null)}>+ New</button>
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[
              ["Supply Type", generated.supply_type], ["Sub Type", generated.sub_type],
              ["From GSTIN", generated.from_gstin], ["To GSTIN", generated.to_gstin],
              ["Transport Mode", generated.transport_mode], ["Vehicle No", generated.vehicle_no || "—"],
              ["Distance", generated.distance + " km"], ["Valid For", Math.ceil(generated.distance/250) + " day(s)"],
            ].map(([k,v]) => (
              <div key={k} style={{ ...card, padding:"14px 18px" }}>
                <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{k}</div>
                <div style={{ fontWeight:600, fontSize:14 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, color:C.primary, marginBottom:14 }}>📋 Bill Details</div>
              <div style={{ marginBottom:12 }}>
                <div style={lbl}>Select Invoice *</div>
                <select style={inp} value={form.invoice_id} onChange={e => {
                  const inv = sales.find(s => s.id === e.target.value);
                  setForm(f => ({ ...f, invoice_id: e.target.value, to_name: inv?.customer_name || "", to_gstin: inv?.gstin || "" }));
                }}>
                  <option value="">-- Select Invoice --</option>
                  {sales.map(s => <option key={s.id} value={s.id}>{s.invoice_number} — {s.customer_name} ({fmt(s.total_value)})</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><div style={lbl}>Supply Type</div>
                  <select style={inp} value={form.supply_type} onChange={e=>setForm({...form,supply_type:e.target.value})}>
                    <option>Outward</option><option>Inward</option>
                  </select>
                </div>
                <div><div style={lbl}>Document Type</div>
                  <select style={inp} value={form.doc_type} onChange={e=>setForm({...form,doc_type:e.target.value})}>
                    <option>Tax Invoice</option><option>Bill of Supply</option><option>Delivery Challan</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, color:C.primary, marginBottom:14 }}>🚚 Transport Details</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><div style={lbl}>Mode</div>
                  <select style={inp} value={form.transport_mode} onChange={e=>setForm({...form,transport_mode:e.target.value})}>
                    <option>Road</option><option>Rail</option><option>Air</option><option>Ship</option>
                  </select>
                </div>
                <div><div style={lbl}>Vehicle No</div><input style={inp} placeholder="MP09AB1234" value={form.vehicle_no} onChange={e=>setForm({...form,vehicle_no:e.target.value})} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><div style={lbl}>Transporter GSTIN</div><input style={inp} placeholder="Optional" value={form.transporter_id} onChange={e=>setForm({...form,transporter_id:e.target.value})} /></div>
                <div><div style={lbl}>Distance (km) *</div><input style={inp} type="number" placeholder="150" value={form.distance||""} onChange={e=>setForm({...form,distance:Number(e.target.value)})} /></div>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, color:C.primary, marginBottom:14 }}>📍 From (Consignor)</div>
              <div style={{ marginBottom:12 }}><div style={lbl}>GSTIN</div><input style={inp} value={form.from_gstin} onChange={e=>setForm({...form,from_gstin:e.target.value})} /></div>
              <div style={{ marginBottom:12 }}><div style={lbl}>Name</div><input style={inp} value={form.from_name} onChange={e=>setForm({...form,from_name:e.target.value})} /></div>
              <div><div style={lbl}>PIN Code</div><input style={inp} placeholder="452001" value={form.from_pincode} onChange={e=>setForm({...form,from_pincode:e.target.value})} /></div>
            </div>
            <div style={card}>
              <div style={{ fontWeight:700, fontSize:14, color:C.primary, marginBottom:14 }}>📍 To (Consignee)</div>
              <div style={{ marginBottom:12 }}><div style={lbl}>GSTIN *</div><input style={inp} placeholder="Buyer GSTIN" value={form.to_gstin} onChange={e=>setForm({...form,to_gstin:e.target.value})} /></div>
              <div style={{ marginBottom:12 }}><div style={lbl}>Name</div><input style={inp} value={form.to_name} onChange={e=>setForm({...form,to_name:e.target.value})} /></div>
              <div><div style={lbl}>PIN Code</div><input style={inp} placeholder="110001" value={form.to_pincode} onChange={e=>setForm({...form,to_pincode:e.target.value})} /></div>
            </div>
            <button style={{ ...btn("success"), width:"100%", justifyContent:"center", padding:"13px", fontSize:15 }} onClick={generate} disabled={loading}>
              {loading ? "⏳ Generating E-Way Bill…" : "🚚 Generate E-Way Bill"}
            </button>
            <div style={{ ...card, padding:16, background:"#FFF9E6" }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>⚠️ Remember:</div>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.8 }}>
                • Required for goods movement above ₹50,000<br/>
                • Valid for 1 day per 250 km for road transport<br/>
                • Must be generated before movement begins
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GOOGLE LOGIN HANDLER (added to AuthScreen) ───────────────────────────────
// Note: To enable Google login, go to Supabase → Authentication → Providers → Google
// Add your Google OAuth Client ID & Secret, then this button will work automatically

// ─── DARK MODE TOGGLE ─────────────────────────────────────────────────────────
// Dark mode is handled via CSS variables in index.html
// The toggle button is added to the top navbar
// Simple upload/reports/calendar/clients/settings pages (unchanged from v1)
function UploadPage({ data }) {
  const [files, setFiles] = useState({ sales:null, purchase:null });
  const [done, setDone] = useState({ sales:false, purchase:false });
  const [toast, setToast] = useState("");
  async function doUpload(type) {
    if (!files[type]) return;
    try {
      const result = await data.uploadExcel(files[type], type);
      setDone(d => ({ ...d, [type]:true }));
      setToast(`✅ ${result.count} records saved to Supabase!`);
      setTimeout(() => setToast(""), 4000);
    } catch(e) { setToast("❌ " + e.message); setTimeout(()=>setToast(""),5000); }
  }
  return (
    <div>
      {toast && <div style={{ position:"fixed", top:20, right:20, background:C.text, color:C.white, padding:"12px 20px", borderRadius:8, zIndex:9999, fontSize:14, fontWeight:600 }}>{toast}</div>}
      <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>📤 Upload GST Data</div>
      <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>Upload Excel/CSV — auto-saved to Supabase</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {[{type:"sales",label:"Sales Data",icon:"📈"},{type:"purchase",label:"Purchase Data",icon:"📉"}].map(({type,label,icon})=>(
          <div key={type} style={card}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>{icon} Upload {label}</div>
            {done[type] ? (
              <div style={{ padding:16, background:C.successLight, borderRadius:8, display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ fontSize:24 }}>✅</span>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, color:C.success }}>Uploaded!</div><div style={{ fontSize:12, color:C.success }}>{files[type]?.name}</div></div>
                <button style={{ ...btn("outline"), fontSize:12, padding:"5px 12px" }} onClick={()=>{ setFiles(f=>({...f,[type]:null})); setDone(d=>({...d,[type]:false})); }}>New</button>
              </div>
            ) : (
              <>
                <div style={{ border:`2px dashed ${C.border}`, borderRadius:10, padding:"24px 20px", textAlign:"center", background:C.bg, marginBottom:12 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
                  <label style={{ ...btn(), display:"inline-flex", cursor:"pointer" }}>
                    📁 Browse Excel / CSV
                    <input type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={e=>setFiles(f=>({...f,[type]:e.target.files[0]}))} />
                  </label>
                </div>
                {files[type] && (
                  <div style={{ background:C.bg, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13 }}>{files[type].name}</span>
                    <button style={btn()} onClick={()=>doUpload(type)} disabled={data.uploading}>{data.uploading?"Uploading…":"Upload & Save"}</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPage({ data, summary }) {
  const [tab, setTab] = useState("gstr1");
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>📄 GST Reports</div>
      <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>{new Date().toLocaleString("en-IN", {month:"long", year:"numeric"})}</div>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[{id:"gstr1",label:"GSTR-1"},{id:"gstr3b",label:"GSTR-3B"},{id:"sales",label:"Sales Register"},{id:"purchase",label:"Purchase Register"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 18px", borderRadius:7, background:tab===t.id?C.primary:C.white, color:tab===t.id?C.white:C.textMuted, fontWeight:tab===t.id?700:500, fontSize:13, cursor:"pointer", border:`1px solid ${tab===t.id?C.primary:C.border}` }}>{t.label}</button>
        ))}
        <button style={{ ...btn("outline"), marginLeft:"auto" }}>⬇️ Download PDF</button>
      </div>
      <div style={card}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{(tab==="sales"?["Invoice No","Date","Customer","Taxable","CGST","SGST","IGST","Total"]:tab==="purchase"?["Bill No","Date","Supplier","Taxable","CGST","SGST","IGST","Total"]:tab==="gstr1"?["Invoice No","Customer","GSTIN","HSN","Taxable","Rate","GST","Total"]:["Category","Gross Tax","ITC","Net Payable"]).map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {(tab==="sales"||tab==="gstr1") && data.sales.map((r,i)=><tr key={i}><td style={{...TD,color:C.primary,fontWeight:600}}>{r.invoice_number}</td><td style={TD}>{r.invoice_date}</td><td style={TD}>{r.customer_name}</td>{tab==="gstr1"&&<><td style={{...TD,fontSize:11,fontFamily:"monospace"}}>{r.gstin||"—"}</td><td style={TD}>{r.hsn}</td><td style={TD}>{r.gst_rate}%</td></>}<td style={TD}>{fmt(r.taxable_value)}</td>{tab!=="gstr1"&&<><td style={TD}>{r.cgst?fmt(r.cgst):"—"}</td><td style={TD}>{r.sgst?fmt(r.sgst):"—"}</td><td style={TD}>{r.igst?fmt(r.igst):"—"}</td></>}{tab==="gstr1"&&<td style={TD}>{fmt((r.cgst||0)+(r.sgst||0)+(r.igst||0))}</td>}<td style={{...TD,fontWeight:700}}>{fmt(r.total_value)}</td></tr>)}
            {tab==="purchase" && data.purchases.map((r,i)=><tr key={i}><td style={{...TD,color:C.success,fontWeight:600}}>{r.bill_number}</td><td style={TD}>{r.bill_date}</td><td style={TD}>{r.supplier_name}</td><td style={TD}>{fmt(r.taxable_value)}</td><td style={TD}>{r.cgst?fmt(r.cgst):"—"}</td><td style={TD}>{r.sgst?fmt(r.sgst):"—"}</td><td style={TD}>{r.igst?fmt(r.igst):"—"}</td><td style={{...TD,fontWeight:700}}>{fmt(r.total_value)}</td></tr>)}
            {tab==="gstr3b" && [["CGST",fmt(summary.cgstTotal),fmt(data.purchases.reduce((a,r)=>a+Number(r.cgst||0),0)),fmt(summary.cgstTotal-data.purchases.reduce((a,r)=>a+Number(r.cgst||0),0))],["SGST",fmt(summary.sgstTotal),fmt(data.purchases.reduce((a,r)=>a+Number(r.sgst||0),0)),fmt(summary.sgstTotal-data.purchases.reduce((a,r)=>a+Number(r.sgst||0),0))],["IGST",fmt(summary.igstTotal),fmt(data.purchases.reduce((a,r)=>a+Number(r.igst||0),0)),fmt(summary.igstTotal-data.purchases.reduce((a,r)=>a+Number(r.igst||0),0))]].map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={{...TD,fontWeight:j===3?700:400}}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const FY = currentDate.getMonth() >= 3 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;

  // Dynamic GST deadlines based on current month/year
  function getDeadlines(year) {
    const d = [];
    for (let m = 0; m < 12; m++) {
      const mn = MONTHS[m];
      const y = m >= 3 ? year : year + 1;
      const period = mn.slice(0,3) + " " + y;
      d.push({ task:"GSTR-1 Filing",    date:new Date(y, m+1, 11), period, color:"#2E86C1", type:"GST",  desc:"Monthly outward supplies return" });
      d.push({ task:"GSTR-3B Filing",   date:new Date(y, m+1, 20), period, color:"#F39C12", type:"GST",  desc:"Summary return with tax payment" });
      d.push({ task:"TDS Deposit",      date:new Date(y, m+1, 7),  period, color:"#E67E22", type:"TDS",  desc:"Deposit TDS deducted last month" });
      if (m === 6) d.push({ task:"ITR Filing",   date:new Date(year+1, 6, 31), period:"FY "+year+"-"+(year+1).toString().slice(2), color:"#C0392B", type:"ITR", desc:"Income Tax Return deadline" });
      if (m === 2) d.push({ task:"GSTR-9 Annual",date:new Date(year+1, 11, 31), period:"FY "+year+"-"+(year+1).toString().slice(2), color:"#1B4F72", type:"Annual", desc:"Annual GST return" });
    }
    return d;
  }

  const allDeadlines = getDeadlines(FY);

  // Get deadlines for current month
  const monthDeadlines = allDeadlines.filter(d =>
    d.date.getMonth() === currentDate.getMonth() &&
    d.date.getFullYear() === currentDate.getFullYear()
  );

  // Get deadlines for selected day
  const dayDeadlines = selectedDay ? allDeadlines.filter(d =>
    d.date.getDate() === selectedDay &&
    d.date.getMonth() === currentDate.getMonth() &&
    d.date.getFullYear() === currentDate.getFullYear()
  ) : [];

  // Upcoming deadlines (next 60 days)
  const upcoming = allDeadlines
    .filter(d => d.date >= today)
    .sort((a,b) => a.date - b.date)
    .slice(0, 8);

  // Calendar grid
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  function prevMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1)); setSelectedDay(null); }
  function nextMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1)); setSelectedDay(null); }
  function goToday()   { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(today.getDate()); }

  const daysUntil = (date) => {
    const diff = Math.ceil((date - today) / (1000*60*60*24));
    if (diff === 0) return { label:"Today!", color:C.danger };
    if (diff < 0)  return { label:`${Math.abs(diff)}d ago`, color:C.textMuted };
    if (diff <= 3) return { label:`${diff}d left`, color:C.danger };
    if (diff <= 7) return { label:`${diff}d left`, color:C.warning };
    return { label:`${diff}d left`, color:C.success };
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800 }}>📅 Compliance Calendar</div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:4 }}>FY {FY}-{(FY+1).toString().slice(2)} — Live GST & Tax Deadlines</div>
        </div>
        <button style={{ ...btn("outline"), fontSize:12 }} onClick={goToday}>📍 Today</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:20 }}>
        {/* Calendar */}
        <div style={card}>
          {/* Month Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={prevMonth} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>‹</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:800, fontSize:17 }}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{monthDeadlines.length} deadlines this month</div>
            </div>
            <button onClick={nextMonth} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>›</button>
          </div>

          {/* Day Headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d =>
              <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.textMuted, padding:"4px 0" }}>{d}</div>
            )}
          </div>

          {/* Calendar Days */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {Array.from({length: startOffset}).map((_,i) => <div key={"e"+i} />)}
            {Array.from({length: daysInMonth}).map((_,i) => {
              const day = i + 1;
              const dayEvents = allDeadlines.filter(d =>
                d.date.getDate() === day &&
                d.date.getMonth() === currentDate.getMonth() &&
                d.date.getFullYear() === currentDate.getFullYear()
              );
              const isToday = today.getDate()===day && today.getMonth()===currentDate.getMonth() && today.getFullYear()===currentDate.getFullYear();
              const isSelected = selectedDay === day;
              const isPast = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  style={{ aspectRatio:"1", borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", background:isSelected?C.primary:isToday?C.primaryLighter:dayEvents.length>0?"#FFF9E6":"transparent", border:`1.5px solid ${isSelected?C.primary:isToday?C.primaryLight:dayEvents.length>0?"#F39C12":"transparent"}`, opacity:isPast?0.45:1, transition:"all 0.15s" }}>
                  <div style={{ fontSize:13, fontWeight:isToday||isSelected?800:400, color:isSelected?C.white:isToday?C.primary:C.text }}>{day}</div>
                  {dayEvents.length > 0 && !isSelected && (
                    <div style={{ display:"flex", gap:2, marginTop:2 }}>
                      {dayEvents.slice(0,3).map((e,i) => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:e.color }} />)}
                    </div>
                  )}
                  {isSelected && dayEvents.length > 0 && <div style={{ fontSize:8, color:"rgba(255,255,255,0.9)", fontWeight:700 }}>{dayEvents.length} due</div>}
                </div>
              );
            })}
          </div>

          {/* Selected day details */}
          {selectedDay && (
            <div style={{ marginTop:14, padding:"12px 14px", background:C.bg, borderRadius:8, border:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>
                {MONTHS[currentDate.getMonth()]} {selectedDay}, {currentDate.getFullYear()}
                {dayDeadlines.length === 0 && <span style={{ color:C.textMuted, fontWeight:400, marginLeft:8 }}>— No deadlines</span>}
              </div>
              {dayDeadlines.map((d,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", background:C.white, borderRadius:7, marginBottom:5, border:`1px solid ${d.color}30` }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:12 }}>{d.task}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>{d.desc}</div>
                  </div>
                  <span style={badge(d.color)}>{d.type}</span>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
            {[["Today",C.primaryLight,"border"],["Has Deadline","#FFF9E6","#F39C12"],["Selected",C.primary,"fill"]].map(([label,bg,border])=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textMuted }}>
                <div style={{ width:12, height:12, borderRadius:3, background:bg, border:`1.5px solid ${border===C.primary?border:border==="border"?C.primaryLight:border}` }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>⏰ Upcoming Deadlines</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {upcoming.map((d,i) => {
                const { label, color } = daysUntil(d.date);
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, background:C.bg, border:`1px solid ${C.border}`, cursor:"pointer" }}
                    onClick={() => { setCurrentDate(new Date(d.date.getFullYear(), d.date.getMonth(), 1)); setSelectedDay(d.date.getDate()); }}>
                    <div style={{ width:42, height:42, borderRadius:8, background:d.color, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:900, color:C.white, lineHeight:1 }}>{d.date.getDate()}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>{MONTHS[d.date.getMonth()].slice(0,3).toUpperCase()}</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.task}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{d.type} • {d.period}</div>
                    </div>
                    <span style={{ ...badge(color), whiteSpace:"nowrap" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* This Month Summary */}
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📊 This Month</div>
            {["GST","TDS","ITR","Annual"].map(type => {
              const count = monthDeadlines.filter(d=>d.type===type).length;
              if (!count) return null;
              const colors = {GST:"#2E86C1",TDS:"#E67E22",ITR:"#C0392B",Annual:"#1B4F72"};
              return (
                <div key={type} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:colors[type] }} />
                    <span style={{ fontSize:13 }}>{type} Deadlines</span>
                  </div>
                  <span style={badge(colors[type])}>{count}</span>
                </div>
              );
            })}
            <div style={{ marginTop:10, fontSize:12, color:C.textMuted, textAlign:"center" }}>
              FY {FY}-{(FY+1).toString().slice(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ClientsPage({ data, auth }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ company_name:"", gstin:"", contact_name:"", email:"", mobile:"", state:"Maharashtra" });
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><div style={{ fontSize:20, fontWeight:800 }}>👥 Clients</div><div style={{ fontSize:13, color:C.textMuted }}>{data.clients.length} clients</div></div>
        <button style={btn()} onClick={()=>setShow(!show)}>+ Add Client</button>
      </div>
      {show && (
        <div style={{ ...card, marginBottom:20, background:C.primaryLighter }}>
          <div style={{ fontWeight:700, marginBottom:14, color:C.primary }}>New Client</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><div style={lbl}>Company</div><input style={inp} onChange={e=>setF({...f,company_name:e.target.value})} /></div>
            <div><div style={lbl}>GSTIN</div><input style={inp} onChange={e=>setF({...f,gstin:e.target.value})} /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
            <div><div style={lbl}>Contact</div><input style={inp} onChange={e=>setF({...f,contact_name:e.target.value})} /></div>
            <div><div style={lbl}>Email</div><input style={inp} onChange={e=>setF({...f,email:e.target.value})} /></div>
            <div><div style={lbl}>State</div><select style={inp} onChange={e=>setF({...f,state:e.target.value})}>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={btn()} onClick={async()=>{ await data.addClient({...f,user_id:auth.activeCompany?.id,status:"Active"}); setShow(false); }}>Save</button>
            <button style={btn("outline")} onClick={()=>setShow(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={card}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Company","GSTIN","State","Contact","Email","Status"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>{data.clients.map((c,i)=>(
            <tr key={i}>
              <td style={{...TD,fontWeight:700}}>{c.company_name}</td>
              <td style={{...TD,fontFamily:"monospace",fontSize:11}}>{c.gstin}</td>
              <td style={TD}>{c.state}</td>
              <td style={TD}>{c.contact_name||"—"}</td>
              <td style={TD}>{c.email||"—"}</td>
              <td style={TD}><span style={badge(c.status==="Active"?C.success:C.textMuted)}>{c.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage({ auth }) {
  const [pf, setPf] = useState({ name:auth.profile?.name||"", email:auth.profile?.email||"", mobile:auth.profile?.mobile||"" });
  const [co, setCo] = useState({ company_name:auth.activeCompany?.company_name||"", gstin:auth.activeCompany?.gstin||"", address:auth.activeCompany?.address||"", state:auth.activeCompany?.state||"Maharashtra" });
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, marginBottom:20 }}>⚙️ Settings</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14, borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>👤 Profile</div>
          <div style={{ marginBottom:12 }}><div style={lbl}>Name</div><input style={inp} value={pf.name} onChange={e=>setPf({...pf,name:e.target.value})} /></div>
          <div style={{ marginBottom:12 }}><div style={lbl}>Email</div><input style={inp} value={pf.email} onChange={e=>setPf({...pf,email:e.target.value})} /></div>
          <div style={{ marginBottom:16 }}><div style={lbl}>Mobile</div><input style={inp} value={pf.mobile} onChange={e=>setPf({...pf,mobile:e.target.value})} /></div>
          <button style={btn()} onClick={async()=>{ await auth.updateProfile(pf); setSaved(true); setTimeout(()=>setSaved(false),2500); }}>{saved?"✓ Saved!":"Update Profile"}</button>
        </div>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14, borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>🏢 Company</div>
          <div style={{ marginBottom:12 }}><div style={lbl}>Company Name</div><input style={inp} value={co.company_name} onChange={e=>setCo({...co,company_name:e.target.value})} /></div>
          <div style={{ marginBottom:12 }}><div style={lbl}>GSTIN</div><input style={inp} value={co.gstin} onChange={e=>setCo({...co,gstin:e.target.value})} /></div>
          <div style={{ marginBottom:12 }}><div style={lbl}>Address</div><input style={inp} value={co.address} onChange={e=>setCo({...co,address:e.target.value})} /></div>
          <div style={{ marginBottom:16 }}><div style={lbl}>State</div><select style={inp} value={co.state} onChange={e=>setCo({...co,state:e.target.value})}>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
          <button style={btn()} onClick={()=>auth.updateCompany(co)}>Update Company</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const data = useData(auth.activeCompany?.id);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(() => localStorage.getItem("ts_dark") === "1");
  useEffect(() => {
    document.body.style.background = dark ? "#0D1117" : "";
    document.body.style.color = dark ? "#E6EDF3" : "";
    localStorage.setItem("ts_dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    // Add bounce animation for AI loading dots
    const style = document.createElement("style");
    style.textContent = `@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`;
    document.head.appendChild(style);
  }, []);

  if (auth.loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.sidebar, color:C.white, flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:32, fontWeight:900 }}>🇮🇳 TaxSaathi 2.0</div>
        <div style={{ color:"rgba(255,255,255,0.6)", fontSize:14 }}>Connecting to Supabase…</div>
      </div>
    );
  }

  if (!auth.user) return <AuthScreen onLogin={auth.signIn} onSignup={auth.signUp} onReset={auth.resetPassword} />;

  const summary = data.computeSummary();

  const nav = [
    { id:"dashboard", label:"Dashboard", icon:"🏠" },
    { id:"invoice", label:"Invoice Generator", icon:"🧾" },
    { id:"upload", label:"Upload Data", icon:"📤" },
    { id:"reports", label:"GST Reports", icon:"📄" },
    { id:"ai", label:"AI Assistant", icon:"🤖", badge:"NEW" },
    { id:"ca", label:"CA Marketplace", icon:"👨‍💼", badge:"NEW" },
    { id:"companies", label:"My Companies", icon:"🏢" },
    { id:"calendar", label:"Compliance", icon:"📅" },
    { id:"clients", label:"Clients", icon:"👥" },
    { id:"einvoice", label:"E-Invoice", icon:"🧾", badge:"NEW" },
    { id:"ewaybill", label:"E-Way Bill", icon:"🚚", badge:"NEW" },
    { id:"whatsapp", label:"WhatsApp Alerts", icon:"💬", badge:"NEW" },
    { id:"ca_enroll", label:"CA Enrollment", icon:"🏅", badge:"NEW" },
    { id:"billing", label:"Plans & Billing", icon:"💳" },
    { id:"settings", label:"Settings", icon:"⚙️" },
  ];

  // Pages are defined as top-level components below


  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Segoe UI', Arial, sans-serif", background:C.bg, overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:220, background:C.sidebar, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
        <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
          <div style={{ fontSize:18, fontWeight:900, color:C.white }}>🇮🇳 TaxSaathi</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2, letterSpacing:1, textTransform:"uppercase" }}>2.0 — Beyond Zoho</div>
        </div>

        {/* Company Switcher */}
        {auth.companies.length > 1 && (
          <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <select style={{ ...inp, background:"rgba(255,255,255,0.08)", color:C.white, border:"1px solid rgba(255,255,255,0.15)", fontSize:12, padding:"6px 10px" }} value={auth.activeCompany?.id} onChange={e=>auth.setActiveCompany(auth.companies.find(c=>c.id===e.target.value))}>
              {auth.companies.map(c=><option key={c.id} value={c.id} style={{ background:C.sidebar }}>{c.company_name}</option>)}
            </select>
          </div>
        )}

        <nav style={{ padding:"8px 0", flex:1 }}>
          {nav.map(n => (
            <div key={n.id} onClick={()=>setPage(n.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", cursor:"pointer", background:page===n.id?"rgba(46,134,193,0.3)":"transparent", color:page===n.id?C.white:"rgba(255,255,255,0.55)", fontSize:13, fontWeight:page===n.id?600:400, borderLeft:`3px solid ${page===n.id?C.primaryLight:"transparent"}`, transition:"all 0.15s", position:"relative" }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.badge && <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:10, background:n.badge==="NEW"?"#E74C3C":"#F39C12", color:C.white }}>{n.badge}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:700, fontSize:13 }}>
              {(auth.profile?.name||auth.user?.email||"U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, color:C.white, fontWeight:600, lineHeight:1.2 }}>{auth.profile?.name || auth.user?.email}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{auth.plan?.toUpperCase()} PLAN</div>
            </div>
          </div>
          <button onClick={auth.signOut} style={{ color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", background:"none", border:"none", padding:0 }}>↩ Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"0 24px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{nav.find(n=>n.id===page)?.icon} {nav.find(n=>n.id===page)?.label}</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {auth.activeCompany && <div style={{ fontSize:12, color:C.textMuted, background:C.bg, padding:"4px 12px", borderRadius:20, border:`1px solid ${C.border}` }}>🏢 {auth.activeCompany.company_name}</div>}
            <div style={{ fontSize:12, color:C.textMuted, background:C.bg, padding:"4px 12px", borderRadius:20, border:`1px solid ${C.border}` }}>📅 March 2026</div>
            <button onClick={()=>setDark(d=>!d)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:20, padding:"4px 12px", cursor:"pointer", fontSize:13, color:C.textMuted }}>{dark?"☀️ Light":"🌙 Dark"}</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:page==="ai"?20:24 }}>
          {page==="dashboard"  && <Dashboard summary={summary} profile={auth.profile} plan={auth.plan} />}
          {page==="invoice"    && <InvoiceGenerator company={auth.activeCompany} clients={data.clients} saveInvoice={data.saveInvoice} />}
          {page==="upload"     && <UploadPage data={data} />}
          {page==="reports"    && <ReportsPage data={data} summary={summary} />}
          {page==="ai"         && <AIAssistant summary={summary} company={auth.activeCompany} />}
          {page==="ca"         && <CAMarketplace />}
          {page==="companies"  && <MultiCompany companies={auth.companies} activeCompany={auth.activeCompany} setActiveCompany={auth.setActiveCompany} addCompany={auth.addCompany} plan={auth.plan} />}
          {page==="calendar"   && <CalendarPage />}
          {page==="clients"    && <ClientsPage data={data} auth={auth} />}
          {page==="einvoice"   && <EInvoice company={auth.activeCompany} sales={data.sales} />}
          {page==="ewaybill"   && <EWayBill company={auth.activeCompany} sales={data.sales} />}
          {page==="whatsapp"   && <WhatsAppNotifications clients={data.clients} company={auth.activeCompany} />}
          {page==="ca_enroll"  && <CAEnrollment />}
          {page==="billing"    && <Subscription plan={auth.plan} upgradePlan={auth.upgradePlan} />}
          {page==="settings"   && <SettingsPage auth={auth} />}
        </div>
      </div>
    </div>
  );
}
