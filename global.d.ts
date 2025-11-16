declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_STORAGE_NAME: string;
    readonly VITE_CLOUD_FUNCTION_URL: string;
    readonly VITE_MAPBOX_TOKEN: string;
  }

  interface CourseEntity {
    id: string;
    name: string;
    summary: string;
    details: string;
    imageUrl?: string;
    imagePath?: string;
    createdBy?: string;
    createdAt: FieldValue | Timestamp;
  }
}

export {};
