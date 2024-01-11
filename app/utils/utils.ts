export async function formData(
  request: Request
): Promise<{ [key: string]: string }> {
  return Object.fromEntries(
    (await request.formData()).entries()
  ) as unknown as any;
}

export async function jsonData(request: Request): Promise<any> {
  return await request.json();
}
