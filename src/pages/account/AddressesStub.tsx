import { MapPin } from "lucide-react";

const AddressesStub = () => (
  <div className="bg-surface border border-subtle rounded-2xl p-12 text-center">
    <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
      <MapPin className="h-6 w-6 text-primary-glow" />
    </div>
    <h2 className="font-display text-xl font-bold mb-2">Direcciones</h2>
    <p className="text-sm text-muted-foreground">Gestión completa en el siguiente bloque (Mi Cuenta).</p>
  </div>
);

export default AddressesStub;
