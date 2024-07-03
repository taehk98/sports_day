import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';

const Dropdown = ({ endpoint, placeholder, onChange, custom=null }) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();

        const formattedOptions = data.map(item => ({
          value: item.teamName || item.activity,
          label: item.teamName || item.activity
        }));
        var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        const options = formattedOptions.sort((a, b) => collator.compare(a.label, b.label));

        setOptions(options);
      } catch (error) {
        toast.error('데이터를 가져오는데 실패했습니다', {
          duration: 3000,
        });
      }
    };

    fetchData();
  }, [endpoint]);

  const customStyles = {
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menu: (provided) => ({
      ...provided,
      maxHeight: '150px', // 원하는 높이로 설정
      overflowY: 'auto', // overflow 설정
      fontSize: '16px',
      zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '150px', // 메뉴 리스트의 최대 높이 설정
      fontSize: '16px',
      zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
    }),
    option: (provided) => ({
        ...provided,
        fontSize: '16px', // 옵션 항목의 폰트 크기 설정
        zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
      }),
      control: (provided) => ({
        ...provided,
        fontSize: '16px', // 선택된 항목의 폰트 크기 설정
        zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
      }),
  };

  const snackStyles = {
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menu: (provided) => ({
      ...provided,
      maxHeight: '120px', // 원하는 높이로 설정
      overflowY: 'auto', // overflow 설정
      fontSize: '16px',
      zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '120px', // 메뉴 리스트의 최대 높이 설정
      fontSize: '16px',
      zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
    }), 
    option: (provided) => ({
        ...provided,
        fontSize: '16px', // 옵션 항목의 폰트 크기 설정
        zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
      }),
      control: (provided) => ({
        ...provided,
        fontSize: '16px !important', // 선택된 항목의 폰트 크기 설정
        zIndex: 300 // 드랍다운 메뉴의 z-index 값 설정
      }),
  };


  return (
    <Select
      className="basic-single md:w-96 w-3/5 h-full text-base z-40"
      classNamePrefix="select"
      isSearchable={true}
      menuPortalTarget={document.body} 
      menuPlacement="auto"
      placeholder={placeholder}
      options={options}
      onChange={onChange}
      styles={custom ? snackStyles : customStyles}
    />
  );
};

export default Dropdown;
