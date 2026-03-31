type SendInAppInput = {
  userId: string;
  message: string;
};

export async function sendInAppNotification({
  userId,
  message,
}: SendInAppInput) {
  if (!userId) {
    throw new Error("Missing userId for in-app notification");
  }

  // Temporary placeholder for SuprSend integration
  // Replace with actual SDK implementation later
  console.log("SuprSend in-app notification", {
    userId,
    message,
  });

  return { success: true };
}