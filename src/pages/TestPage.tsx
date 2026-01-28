import { useEffect } from "react";

export function TestPage() {
  useEffect(() => {
    console.log("TestPage rendered");
  }, []);

  return (
    <div style={{ backgroundColor: 'red', width: '100%', height: '200px' }}>
      <h1 style={{ color: 'white', padding: '20px' }}>THIS IS A TEST PAGE</h1>
      <p style={{ color: 'white', padding: '20px' }}>If you can see this, the basic rendering is working. Check the console for logs.</p>
    </div>
  );
}
