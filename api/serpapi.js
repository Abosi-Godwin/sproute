export default async function handler(req, res) {
  const params = new URLSearchParams(req.query);
  params.set('api_key', process.env.SERPAPI_KEY);

  const response = await fetch(
    `https://serpapi.com/search?${params}`
  );

  const data = await response.json();
  res.status(response.status).json(data);
}