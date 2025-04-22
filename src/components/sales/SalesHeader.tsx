
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SalesHeaderProps {
  title: string;
}

const SalesHeader = ({ title }: SalesHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button onClick={() => navigate("/sales/new")}>
        <Plus className="mr-2 h-4 w-4" />
        New Sale
      </Button>
    </div>
  );
};

export default SalesHeader;
