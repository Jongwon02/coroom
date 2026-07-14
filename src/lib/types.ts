export interface Room {
  id: number;
  name: string;
  capacity: number;
  floor: string;
  equipment: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Reservation {
  id: string;
  room_id: number;
  title: string;
  reserver_name: string;
  reserver_email: string;
  reserver_department: string | null;
  attendees: number | null;
  description: string | null;
  start_time: string; // ISO
  end_time: string; // ISO
  status: "approved" | "cancelled";
  created_at: string;
}

export type NewReservation = Omit<Reservation, "id" | "status" | "created_at">;
