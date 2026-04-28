import { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("Ready ✅");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [address, setAddress] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 📸 Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOn(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setResult("🚫 Camera blocked");
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(URL.createObjectURL(blob));
      setResult("Image captured ✅");
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraOn(false);
  };

  // 📂 Upload
  const handleUpload = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult("Image uploaded ✅");
  };

  // 🔄 Reset
  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult("Ready again ✅");
  };

  // 🚨 SOS ( AI + Location)
  const handleSOS = async () => {
  if (!image) {
    setResult("❌ Upload or capture image first");
    return;
  }

  setLoading(true);
  setResult("Analyzing...");

  // 📍 Get location (keep this)
  navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    setLocation({ lat, lng });

    fetchHospitals(lat, lng); // ✅ THIS IS THE MAIN ADD
  },
  () => setResult("⚠️ Location access denied")
);
  try {
    // Convert image → base64
    const buffer = await image.arrayBuffer();

    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // 🔥 CALL YOUR BACKEND
    const res = await fetch("https://crisisnet-j42e.onrender.com/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64: base64 }),
    });

    const data = await res.json();
    const text = data.output; 
    const fixedText = text.replace(/911/g, "112");
    

    if (text.includes("EMERGENCY: YES")) {
  new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg").play();
}

if (text.includes("EMERGENCY: YES")) {
  setResult({
    type: "emergency",
    content: text.replace("EMERGENCY: YES", "").trim(),
  });
   alert("🚨 Emergency detected! Call 112 immediately."); 
} else {
  setResult({
    type: "safe",
    content: text.replace("EMERGENCY: NO", "").trim(),
  });
}

  } catch (err) {
    console.error(err);
    setResult("❌ API failed");
  }

  setLoading(false);
};

const fetchHospitals = async (lat, lon) => {
  try {
    
    const fetchHospitals = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://crisisnet-j42e.onrender.com/hospitals`
    );
    const data = await res.json();
    setHospitals(data.elements);
  } catch (err) {
    console.log("Hospital fetch failed");
  }
};
    const data = await res.json();
    setHospitals(data.elements);
  } catch (err) {
    console.log("Hospital fetch failed");
  }
};

  return (
    <div style={{
      minHeight: "100vh",
      background:
  result?.type === "emergency"
    ? "linear-gradient(135deg, #7f1d1d, #1f2937)"
    : "linear-gradient(135deg, #020617, #0f172a)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        width: "360px",
        padding: "25px",
        borderRadius: "20px",
        background: "#111827",
        textAlign: "center"
      }}>
        <h2 style={{ fontSize: "22px", fontWeight: "bold" }}>
  🚨 CrisisNet
</h2>
<p style={{ fontSize: "13px", color: "#94a3b8" }}>
  AI-powered emergency response
</p>

        {!preview && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        )}

        {!preview && (
          <button onClick={startCamera} style={btnBlue}>
            📷 Use Camera
          </button>
        )}

        {cameraOn && (
          <>
            <video ref={videoRef} autoPlay style={{ width: "100%", borderRadius: 10 }} />
            <button onClick={capturePhoto} style={btnGreen}>
              Capture
            </button>
          </>
        )}

        {preview && (
          <>
            <img src={preview} style={{ width: "100%", borderRadius: 10 }} />
            <button onClick={reset} style={btnGray}>
              🔄 Retake
            </button>
          </>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <button onClick={handleSOS} style={btnRed}>
          🚨 SOS ANALYZE
        </button>

        {result?.type === "emergency" && (
  <button
    onClick={() => (window.location.href = "tel:112")}
    style={{
      marginTop: 10,
      padding: 12,
      width: "100%",
      background: "#dc2626",
      border: "none",
      borderRadius: 10,
      color: "white",
      fontWeight: "bold",
      fontSize: "16px"
    }}
  >
    📞 CALL EMERGENCY (112)
  </button>
)}

        {loading && <p>⏳ Processing...</p>}

        <div style={{
          marginTop: 10,
          background: "#1f2937",
          padding: 10,
          borderRadius: 10,
          minHeight: 80,
          whiteSpace: "pre-line"
        }}>
          {typeof result === "object" ? (
  <div>
    {result.type === "emergency" ? (
      <>
        <h3 style={{ color: "red" }}>🚨 EMERGENCY DETECTED</h3>
        <div style={{
  background: "#1e3a8a",
  padding: 10,
  borderRadius: 10,
  marginTop: 10
}}>
   {result.content}
</div>
      </>
    ) : (
      <>
        <h3 style={{ color: "green" }}>✅ No Emergency</h3>
        <p>{result.content}</p>
      </>
    )}
  </div>
) : (
  result
)}
        </div>
        {result?.type === "emergency" && (
  <div style={{
    marginTop: 10,
    background: "#1e293b",
    padding: 10,
    borderRadius: 10,
    textAlign: "left"
  }}>
    <h4>👥 Nearby Helpers</h4>
    <p>👨‍⚕️ Doctor available</p>
    <p>🔥 Fire-trained staff nearby</p>
    <p>🌐 Multilingual support</p>
  </div>
)}

        {/* MAP */}
        {result?.type === "emergency" && (
  <div style={{
    marginTop: 15,
    background: "#052e16",
    padding: 10,
    borderRadius: 10,
    textAlign: "left"
  }}>
    <h4>📊 Live Incident Summary</h4>

    <p>🚨 Status: Emergency</p>
    {address && <p>📍 Location: {address}</p>}
    <p>🧠 AI Analysis Active</p>

    <div style={{ marginTop: 10 }}>
      <button onClick={() => alert("📡 Alert sent")} style={btnGreen}>
        📡 Notify Responders
      </button>

      <button onClick={() => window.location.href = "tel:112"} style={btnBlue}>
        📞 Contact Emergency
      </button>
    </div>
  </div>
)}
        {location && (
  <>
    <MapContainer
      center={location}
      zoom={15}
      style={{ height: "200px", marginTop: "10px", borderRadius: "10px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
   <Marker position={location}>
  <Popup>You are here 📍</Popup>
</Marker>

{hospitals.map((h, i) => (
  <Marker key={i} position={[h.lat, h.lon]}>
    <Popup>🏥 Hospital Nearby</Popup>
  </Marker>
))}
    </MapContainer>

    <p style={{ marginTop: 8, fontSize: "12px", color: "#9ca3af" }}>
      📍 Nearby hospitals & emergency services visible on map
    </p>
  </>
)}
      </div>
    </div>
  );
}

// 🎨 styles
const btnBlue = { marginTop: 10, padding: 10, width: "100%", background: "#2563eb", border: "none", borderRadius: 10, color: "white" };
const btnGreen = { marginTop: 10, padding: 10, width: "100%", background: "green", border: "none", borderRadius: 10, color: "white" };
const btnRed = { marginTop: 15, padding: 14, width: "100%", background: "red", border: "none", borderRadius: 10, color: "white", fontWeight: "bold" };
const btnGray = { marginTop: 10, padding: 8, width: "100%", background: "#374151", border: "none", borderRadius: 10, color: "white" };