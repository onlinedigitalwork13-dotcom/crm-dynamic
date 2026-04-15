"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CreateApplicationPage() {
  const params = useSearchParams();
  const leadId = params.get("leadId");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!leadId) return;

      const res = await fetch(`/api/leads/${leadId}/prefill`);
      const json = await res.json();

      setData(json);
      setLoading(false);
    }

    load();
  }, [leadId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create Application</h1>

      {/* STUDENT */}
      <div className="border p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Student</h2>
        <p>{data.client?.firstName} {data.client?.lastName}</p>
        <p>{data.client?.email}</p>
      </div>

      {/* APPLICATION */}
      <div className="border p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Application</h2>
        <p>Provider: {data.application.providerName}</p>
        <p>Course: {data.application.courseName}</p>
        <p>Intake: {data.application.intake}</p>
      </div>

      {/* SUBAGENT */}
      <div className="border p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Subagent</h2>
        <p>{data.subagent.name}</p>
        <p>{data.subagent.agency}</p>
      </div>

      <button className="bg-black text-white px-4 py-2 rounded-xl">
        Create Application
      </button>
    </div>
  );
}