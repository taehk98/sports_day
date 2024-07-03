import React from 'react';
import AnimationWrapper from '../common/page-animation';
import shorts from '../assets/fsy_activity_day.jpg';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <AnimationWrapper>
      <div className='flex flex-col mx-2 items-center justify-center pt-5' >
        <div className='flex mt-6 lg:mt-10'>
          <img src={shorts} width={100} height={100} className='w-full h-full md:w-96 md:h-96 rounded-xl' alt='banner' />
        </div>
    
        <div className='pt-6 flex flex-items gap-5'>
        <Link to='/rank' className='mb-14 lg-mb-30 rounded-xl bg-gradient-to-r from-indigo-400 
        via-purple-500 to-pink-500 hover:from-indigo-400  hover:via-pink-400 hover:to-red-500 px-6 py-4 font-bold text-white text-2xl'>실시간 순위</Link>
        <Link to='/map' className='mb-14 lg-mb-30 rounded-xl bg-gradient-to-r from-lightblue
        via-fsylightblue to-fsyblue px-6 py-4 font-bold text-white text-2xl'>지도 보기</Link>
        </div>
      </div>
    </AnimationWrapper>
  );
};

export default HomePage;