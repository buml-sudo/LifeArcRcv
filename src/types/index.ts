// LifeArcRcv — pouze typy relevantní pro kapsle

export interface TimeCapsule {
  id: string;
  created_at?: string;          // ISO datum vytvoření
  unlock_date: string;          // ISO datum odemknutí
  title: string;
  content_type: 'text' | 'audio' | 'photo' | 'mixed';
  content_ref: string;
  encrypted: boolean;
  encrypted_content?: string;   // base64 AES-256-GCM blob
  notification_scheduled: boolean;
  offline_tolerance: number | null; // hodiny; null = vždy vyžaduj online
}

// Lokálně uložená kapsle v RCV (obsahuje původní .arc cestu)
export interface ReceivedCapsule {
  id: string;                   // uuid
  importedAt: string;           // ISO — kdy bylo importováno
  arcSourcePath?: string;       // původní cesta k .arc souboru (volitelné)
  capsule: TimeCapsule;         // dekódovaná (ale NE dešifrovaná) kapsle
}
