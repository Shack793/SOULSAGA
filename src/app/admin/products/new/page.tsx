import ProductForm from "@/components/ProductForm";

export const metadata = { title: "Add product" };

export default function NewProduct() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold">Add a book or course</h1>
      <ProductForm />
    </div>
  );
}
