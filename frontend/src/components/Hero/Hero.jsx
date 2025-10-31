// src/components/Hero/Hero.jsx
import React from 'react';
import styles from './Hero.module.css';
import BackgroundImage from '../../assets/hero-background.jpg';
import { Link } from 'react-router-dom';

const Hero = () => {
  const heroStyle = {
    backgroundImage: `linear-gradient(rgba(10, 44, 90, 0.7), rgba(10, 44, 90, 0.7)), url(${BackgroundImage})`
  };

  return (
    <section className={styles.hero} style={heroStyle}>
      <div className={styles.content}>
        <h1 className={styles.title}>Temukan Hunian dan Investasi Terbaik di Garut</h1>
        <p className={styles.subtitle}>
          Selamat datang di Infogarut Property, platform tepercaya untuk menemukan berbagai pilihan properti terbaik di Garut!<br /> Dari rumah hunian nyaman,
          tanah strategis, hingga proyek investasi potensial, semua dapat Anda temukan dengan mudah di sini.
        </p>
        <Link to="/properti" className={styles.ctaButton}>
          Jelajahi Properti
        </Link>
      </div>
    </section>
  );
};

export default Hero;