export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
): Promise<void> {
  if (!webhookUrl.startsWith("https://hooks.slack.com/")) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error("Failed to send Slack notification:", err);
  }
}
