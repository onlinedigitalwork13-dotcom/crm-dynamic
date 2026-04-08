export async function fetchCoursesFromAPI(endpoint: string) {
  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch API");
  }

  const data = await res.json();

  // assume array response
  if (!Array.isArray(data)) {
    throw new Error("Invalid API response format");
  }

  return data.map((item: any) => ({
    providerName: item.providerName || "",
    courseName: item.name || item.courseName,
    courseCode: item.code,
    level: item.level,
    duration: item.duration,
    tuitionFee: item.tuitionFee,
    intakeMonths: item.intakeMonths,
    campus: item.campus,
    description: item.description,
  }));
}