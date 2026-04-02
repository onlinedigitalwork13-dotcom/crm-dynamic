"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

function input() {
  return "w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm";
}

function textarea() {
  return "w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm";
}

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;

  const [form, setForm] = useState({
    name: "",
    code: "",
    level: "",
    category: "",
    studyMode: "",
    duration: "",
    durationValue: "",
    durationUnit: "",
    tuitionFee: "",
    applicationFee: "",
    materialFee: "",
    currency: "AUD",
    campus: "",
    intakeMonths: "",
    entryRequirements: "",
    englishRequirements: "",
    description: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/providers/${providerId}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        durationValue: Number(form.durationValue) || null,
        tuitionFee: Number(form.tuitionFee) || null,
        applicationFee: Number(form.applicationFee) || null,
        materialFee: Number(form.materialFee) || null,
      }),
    });

    if (res.ok) {
      router.push(`/providers/${providerId}/courses`);
      router.refresh();
    } else {
      alert("Failed to create course");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Create Course</h1>

      <form onSubmit={handleSubmit} className="grid gap-6">

        {/* BASIC */}
        <div className="grid gap-4 md:grid-cols-2">
          <input className={input()} placeholder="Course Name" value={form.name}
            onChange={(e)=>setForm({...form,name:e.target.value})} required />

          <input className={input()} placeholder="Course Code"
            onChange={(e)=>setForm({...form,code:e.target.value})} />
        </div>

        {/* STRUCTURE */}
        <div className="grid gap-4 md:grid-cols-3">
          <input className={input()} placeholder="Level"
            onChange={(e)=>setForm({...form,level:e.target.value})} />

          <input className={input()} placeholder="Category"
            onChange={(e)=>setForm({...form,category:e.target.value})} />

          <input className={input()} placeholder="Study Mode"
            onChange={(e)=>setForm({...form,studyMode:e.target.value})} />
        </div>

        {/* DURATION */}
        <div className="grid gap-4 md:grid-cols-3">
          <input className={input()} placeholder="Duration (text)"
            onChange={(e)=>setForm({...form,duration:e.target.value})} />

          <input className={input()} placeholder="Duration Value"
            onChange={(e)=>setForm({...form,durationValue:e.target.value})} />

          <input className={input()} placeholder="Duration Unit"
            onChange={(e)=>setForm({...form,durationUnit:e.target.value})} />
        </div>

        {/* FEES */}
        <div className="grid gap-4 md:grid-cols-4">
          <input className={input()} placeholder="Tuition Fee"
            onChange={(e)=>setForm({...form,tuitionFee:e.target.value})} />

          <input className={input()} placeholder="Application Fee"
            onChange={(e)=>setForm({...form,applicationFee:e.target.value})} />

          <input className={input()} placeholder="Material Fee"
            onChange={(e)=>setForm({...form,materialFee:e.target.value})} />

          <input className={input()} placeholder="Currency"
            value={form.currency}
            onChange={(e)=>setForm({...form,currency:e.target.value})} />
        </div>

        {/* LOCATION */}
        <div className="grid gap-4 md:grid-cols-2">
          <input className={input()} placeholder="Campus"
            onChange={(e)=>setForm({...form,campus:e.target.value})} />

          <input className={input()} placeholder="Intakes"
            onChange={(e)=>setForm({...form,intakeMonths:e.target.value})} />
        </div>

        {/* REQUIREMENTS */}
        <textarea className={textarea()} placeholder="Entry Requirements"
          onChange={(e)=>setForm({...form,entryRequirements:e.target.value})} />

        <textarea className={textarea()} placeholder="English Requirements"
          onChange={(e)=>setForm({...form,englishRequirements:e.target.value})} />

        {/* DESCRIPTION */}
        <textarea className={textarea()} placeholder="Description"
          onChange={(e)=>setForm({...form,description:e.target.value})} />

        {/* ACTIVE */}
        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={form.isActive}
            onChange={(e)=>setForm({...form,isActive:e.target.checked})}/>
          Active Course
        </label>

        <button className="bg-black text-white px-6 py-3 rounded-xl">
          {saving ? "Creating..." : "Create Course"}
        </button>

      </form>
    </div>
  );
}