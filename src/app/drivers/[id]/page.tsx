import DriverProfileClient from "./driver-profile-client";

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <DriverProfileClient driverId={id} />;
}
