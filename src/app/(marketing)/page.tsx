import { redirect } from "next/navigation";

// Marketing pages are handled by the root `/` page.
// This route group exists for the `/pricing` sub-page.
export default function MarketingIndex() {
  redirect("/");
}
