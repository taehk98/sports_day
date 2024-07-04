import React from 'react';
import { MDBListGroup, MDBListGroupItem, MDBBadge } from 'mdb-react-ui-kit';

const EventList = () => {
  return (
    <>
      <MDBListGroup style={{ minWidth: '22rem' }} light>
        <MDBListGroupItem className='d-flex justify-content-between align-items-center'>
          <div>
            <div className='fw-bold'>John Doe</div>
            <div className='text-muted'>john.doe@gmail.com</div>
          </div>
          <MDBBadge pill light color='success'>
            Active
          </MDBBadge>
        </MDBListGroupItem>
        <MDBListGroupItem className='d-flex justify-content-between align-items-center'>
          <div>
            <div className='fw-bold'>Alex Ray</div>
            <div className='text-muted'>alex.ray@gmail.com</div>
          </div>
          <MDBBadge pill light color='primary'>
            Onboarding
          </MDBBadge>
        </MDBListGroupItem>
        <MDBListGroupItem className='d-flex justify-content-between align-items-center'>
          <div>
            <div className='fw-bold'>Kate Hunington</div>
            <div className='text-muted'>kate.hunington@gmail.com</div>
          </div>
          <MDBBadge pill light color='warning'>
            Awaiting
          </MDBBadge>
        </MDBListGroupItem>
      </MDBListGroup>
    </>
  );
}

export default EventList;