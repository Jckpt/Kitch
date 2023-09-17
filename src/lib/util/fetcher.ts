export const fetcher = async (params) => {
  const [url, headerValue] = params
  const data = await fetch(url, headerValue)
  return data.json()
}
