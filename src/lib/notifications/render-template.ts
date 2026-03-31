export function renderTemplate(
  template: string,
  data: Record<string, any> = {}
): string {
  let output = template;

  for (const [key, value] of Object.entries(data)) {
    output = output.replaceAll(`{{${key}}}`, String(value ?? ""));
  }

  return output;
}