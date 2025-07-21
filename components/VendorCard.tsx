// components/VendorCard.tsx
"use client";

import React from "react";
// Removed: import { motion } from "framer-motion"; (This line is now permanently gone)
import Image from "next/image";
import Link from "next/link";

export default function VendorCard({ vendor }: { vendor: any }) {
  return (
    // Replaced <motion.div> with <div> AND REMOVED ALL FRAMER-MOTION PROPS
    // This div will no longer have any animation-related props like initial, whileInView, etc.
    <div className="glass-card flex flex-col items-center justify-center text-center p-6 cursor-pointer">
      <Link href={`/vendor/${vendor.id}`} passHref className="flex flex-col items-center justify-center w-full h-full">
        <Image
          src={vendor.image} // Assuming vendor.image exists and is a valid URL
          alt={vendor.name}
          width={150} // Adjust width and height as needed
          height={150}
          className="rounded-full mb-4 object-cover"
        />
        <h3 className="text-xl font-semibold text-white mb-2">{vendor.name}</h3>
        <p className="text-gray-400 text-sm line-clamp-2">{vendor.description}</p>
      </Link>
    </div>
  );
}