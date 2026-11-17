import { redirect } from "next/navigation";

// Orders live inside the account dashboard, as in the theme.
export default function OrdersPage() {
  redirect("/account#orders");
}
