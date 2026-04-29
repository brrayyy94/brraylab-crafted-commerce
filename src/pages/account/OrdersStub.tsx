import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const OrdersStub = () => (
  <div className="bg-surface border border-subtle rounded-2xl p-12 text-center">
    <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
      <Package className="h-6 w-6 text-primary-glow" />
    </div>
    <h2 className="font-display text-xl font-bold mb-2">Aún sin pedidos</h2>
    <p className="text-sm text-muted-foreground mb-6">El listado completo llegará en el siguiente bloque.</p>
    <Link to="/tienda">
      <Button className="bg-primary hover:bg-primary/90">Explorar tienda</Button>
    </Link>
  </div>
);

export default OrdersStub;
