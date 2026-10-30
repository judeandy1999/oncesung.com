export function sentGiftStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "paid":
      return "Sent — waiting for claim";
    case "claimed":
      return "Claimed — song in progress";
    case "consumed":
      return "Used — song ordered";
    default:
      return status;
  }
}
