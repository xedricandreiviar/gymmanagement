import { PlanForm } from "./plan-form";

export const metadata = { title: "New Plan — GymFlow" };

export default function NewPlanPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PlanForm />
    </div>
  );
}
