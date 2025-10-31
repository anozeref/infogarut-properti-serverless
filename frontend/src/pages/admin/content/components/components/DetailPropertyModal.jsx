import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaTag, FaMapMarkerAlt, FaBuilding, FaUser, FaClock,
  FaInfoCircle, FaBed, FaBath, FaRulerCombined, FaHandshake, FaImage, FaExpand,
} from "react-icons/fa";
import styles from "./DetailPropertyModal.module.css";
import { MEDIA_URL } from "../../../../../utils/constant";

// Format harga ke Rupiah
const formatPrice = (price) => {
  if (price === null || price === undefined) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
};

// Capitalize first letter
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Modal Detail Properti Admin
export default function DetailPropertyModal({ data, onClose, ownerName, postedAt }) {
  const [mainImage, setMainImage] = useState("");
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (data?.media && data.media.length > 0) {
      setMainImage(`${MEDIA_URL}${data.media[0]}`);
    } else {
      setMainImage("");
    }
  }, [data]);

  if (!data) return null;

  // Buka lightbox gambar
  const handleOpenLightbox = () => {
    if (mainImage) setLightboxOpen(true);
  };

  // Gabungkan lokasi lengkap
  const fullLocation = [data.lokasi, data.desa, data.kecamatan, "Garut"].filter(Boolean).join(", ");

  return (
    <>
      <AnimatePresence>
        <motion.div className={styles.backdrop} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
            
            {/* Header modal */}
            <div className={styles.header}>
              <h3>Detail Properti</h3>
              <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
            </div>

            {/* Body modal */}
            <div className={styles.body}>
              <div className={styles.gallery}>
                <div className={styles.mainImageWrapper}>
                  {mainImage ? (
                    <>
                      <img src={mainImage} alt={data.namaProperti} className={styles.mainImage} />
                      <button className={styles.expandBtn} onClick={handleOpenLightbox} title="Perbesar Gambar">
                        <FaExpand />
                      </button>
                    </>
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <FaImage />
                      <span>Tidak ada gambar</span>
                    </div>
                  )}
                </div>
                
                {data.media && data.media.length > 1 && (
                  <div className={styles.thumbnailGallery}>
                    {data.media.map((fileName) => {
                      const imageUrl = `${MEDIA_URL}${fileName}`;
                      return (
                        <img
                          key={fileName}
                          src={imageUrl}
                          alt="thumbnail"
                          className={mainImage === imageUrl ? styles.activeThumbnail : ""}
                          onClick={() => setMainImage(imageUrl)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Konten detail */}
              <div className={styles.content}>
                <div className={styles.titleSection}>
                  <h4>{data.namaProperti || "Nama Properti"}</h4>
                  <span className={styles.location}><FaMapMarkerAlt /> {fullLocation}</span>
                </div>

                <div className={styles.priceSection}>
                  <h2>{formatPrice(data.harga)}</h2>
                  <span>{data.periodeSewa?.substring(1).trim() || ""}</span>
                </div>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}><FaTag /><span>{capitalize(data.tipeProperti) || "-"}</span></div>
                  <div className={styles.detailItem}><FaHandshake /><span>{capitalize(data.jenisProperti) || "-"}</span></div>
                  {data.kamarTidur > 0 && <div className={styles.detailItem}><FaBed /><span>{data.kamarTidur} KT</span></div>}
                  {data.kamarMandi > 0 && <div className={styles.detailItem}><FaBath /><span>{data.kamarMandi} KM</span></div>}
                  {data.luasBangunan > 0 && <div className={styles.detailItem}><FaBuilding /><span>{data.luasBangunan} m² <small>(Bangunan)</small></span></div>}
                  {data.luasTanah > 0 && <div className={styles.detailItem}><FaRulerCombined /><span>{data.luasTanah} m² <small>(Tanah)</small></span></div>}
                </div>
                
                <div className={styles.description}>
                  <h5>Deskripsi</h5>
                  <p>{data.deskripsi || "Tidak ada deskripsi."}</p>
                </div>

                <div className={styles.adminInfo}>
                  <div className={styles.infoRow}><FaUser /><span><strong>Pemilik:</strong> {ownerName || "-"}</span></div>
                  <div className={styles.infoRow}><FaClock /><span><strong>Waktu Post:</strong> {postedAt || "-"}</span></div>
                  <div className={styles.infoRow}><FaInfoCircle /><span><strong>Status:</strong> <span className={`${styles.badge} ${styles[data.statusPostingan]}`}>{data.statusPostingan}</span></span></div>
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className={styles.footer}>
              <button type="button" className={styles.closeBtnFooter} onClick={onClose}>Tutup</button>
            </div>

          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Lightbox gambar */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div className={styles.lightboxBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxOpen(false)}>
            <button className={styles.lightboxCloseBtn}><FaTimes /></button>
            <motion.img 
              src={mainImage} 
              className={styles.lightboxImage} 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}