export default function App() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Left Panel */}
      <div style={{ width: "300px", background: "#020617", color: "white" }}>
        <h3>Controls</h3>
        {/* buttons, inputs, steps */}
      </div>

      {/* Right Panel (Browser) */}
      <div style={{ flex: 1 }}>
        <iframe
          src="http://localhost:3000/viewer"
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>

    </div>
  );
}
