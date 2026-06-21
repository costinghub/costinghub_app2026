
export async function onRequestPost({ request, env }) {
  try {
    const { model, prompt, system } = await request.json();
    const apiKey = request.headers.get('x-user-api-key');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing Anthropic API Key header (x-user-api-key)' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: system || "You are a helpful assistant.",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });
    
    const responseData = await response.json();
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
