import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import screenshot1 from '../assets/example1.png';
import screenshot2 from '../assets/example2.png';
import screenshot3 from '../assets/example3.png';
import screenshot4 from '../assets/example4.png';
import screenshot5 from '../assets/example5.png';
import screenshot6 from '../assets/example6.png';

const Examples = () => {
  const screenshots = [screenshot1, screenshot2, screenshot3, screenshot4, screenshot5, screenshot6];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % screenshots.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [screenshots.length]);

  return (
    <div className='h-[calc(100vh-80px)] pt-3 carousel-wrapper overflow-auto'>
      <h1 className='text-4xl font-gelasio capitalize text-center mb-5'>
            Join us today
          </h1>
      <div className='text-2xl font-bold text-center lg:max-w-[200px] max-w-[60%] my-auto mx-auto py-2 bg-pink-100 flex justify-center relative'>
            <span >실제 화면</span>
      </div>
      <div className='carousel-container lg:max-h-[450px] lg:max-w-[200px] max-w-[60%] flex my-auto mx-auto border-2 border-gray-200 rounded-lg overflow-hidden'>

        <Carousel
          showArrows={true}
          showThumbs={false}
          showStatus={false}
          infiniteLoop={true}
          autoPlay={true}
          interval={3000}
          stopOnHover={false}
          swipeable={true}
          emulateTouch={true}
          dynamicHeight={false}
          onChange={(index) => setCurrentSlide(index)}
          selectedItem={currentSlide}
          className='custom-carousel'
        >
          {screenshots.map((screenshot, index) => (
            <div key={index} className='carousel-image-container'>
              <img src={screenshot} alt={`Screenshot ${index + 1}`} className='carousel-image' />
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default Examples;
