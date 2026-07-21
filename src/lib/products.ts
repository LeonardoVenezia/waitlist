export type Product = {
  id: string;
  name: string;
  icon: string; // emoji or icon id
  href: string;
};

export const products: Product[] = [
  {
    id: "waitlist",
    name: "Waitlist",
    icon: "🎯",
    href: "/dashboard",
  },
];
