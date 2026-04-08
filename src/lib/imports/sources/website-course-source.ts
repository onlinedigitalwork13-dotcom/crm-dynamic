export async function fetchCoursesFromWebsite(url: string) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch website");
  }

  const html = await res.text();

  // VERY BASIC extraction (v1)
  // Later you can upgrade to Cheerio parsing

  const courseMatches = [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)];

  const rows = courseMatches.map((match, index) => ({
    providerName: "", // will be injected from UI or provider context
    courseName: match[1].replace(/<[^>]+>/g, "").trim(),
    level: "",
    duration: "",
    tuitionFee: "",
    intakeMonths: "",
    campus: "",
    description: "",
  }));

  return rows;
}