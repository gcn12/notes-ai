"use client";

export default function Home() {
  const request = async () => {
    const res = await fetch("http://localhost:3002", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    console.log(data);
  };
  return (
    <div>
      <button onClick={request}>click here</button>
    </div>
  );
}
