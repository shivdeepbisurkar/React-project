/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    Button,
    Input,
    Select,
    MenuItem,
    Heading,
    TableContainer,
    Box,
    VStack,
    FormControl,
    FormLabel,
  } from '@chakra-ui/react';
import { GoogleMap, Polyline, Marker, LoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getLatLng, getGeocode } from 'use-places-autocomplete';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter } from "@chakra-ui/react";
import axios from 'axios';
import carIconUrl from './car.png';
import Navbar from './Manager';
import OrderStatusDemo from './OrderStatusLine'; // Update the path accordingly


function OrdersManager() {
  const [showPopup, setShowPopup] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [customer, setCustomer] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [packageDimensions, setPackageDimensions] = useState('');
  const [carrierLogo, setCarrierLogo] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [price, setPrice] = useState('');
  const [dateOrdered, setDateOrdered] = useState('');
  const [destination, setDestination] = useState('');
  const [sampleData, setSampleData] = useState([]);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [carIconLocation, setCarIconLocation] = useState('origin'); // Added state for car icon location
  const [mapKey, setMapKey] = useState(0); // Added state for the map key
  const carLocations = ['origin', 'random', 'destination'];

  const navigate = useNavigate();

  const [updateFormData, setUpdateFormData] = useState({
    orderId: '',
    customer: '',
    itemWeight: '',
    packageDimensions: '',
    carrierName: '',
    dateOrdered: '',
    destination: '',
    logo: '',
    price: '',
    phone_number: '',
    email_address: '',
    address: '',
    payment_method: '',
    card_no: '',
    fromLocation: '',
    zipcode: '',
    // ... other fields from your data model
  });
  
  useEffect(() => {
    if(carIconLocation === 'destination'){
      console.log('Order delivered!');
      axios
      .post('http://localhost:8081/updateOrder', {orderId, status: 'Out for Delivery'})
      .then((res) => {
        console.log('Response status:', res.status);
        console.log('Response data:', res.data);
        if(res.status === 200)
          alert('Status updated successfully!');
      });
     setShowStatusDialog(false);
    }
    else{
      const interval = setInterval(() => {
        const currentIndex = carLocations.indexOf(carIconLocation);
        if (currentIndex < carIconLocation.length - 1) {
          setCarIconLocation(carLocations[currentIndex + 1]);
        }
      }, 20000); 
      return () => clearInterval(interval);
    }
    
  }, [carIconLocation]);
  
  
  const openStatusDialog = () => {
    setShowStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setShowStatusDialog(false);
  };
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts
    axios
      .get('http://localhost:8081/orderdata')
      .then((response) => {
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        setSampleData(response.data.data);
        if (response.data.message === 'Data retrieved successfully') {
          console.log('Data retrieved successfully');
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  function getRandomLocationBetween(origin, destination) {
    const latRatio = Math.random();
    const lngRatio = Math.random();
    const latDiff = destination.lat - origin.lat;
    const lngDiff = destination.lng - origin.lng;
    const randomLat = origin.lat + latRatio * latDiff;
    const randomLng = origin.lng + lngRatio * lngDiff;
    return { lat: randomLat, lng: randomLng };
  }

  const handleTrackButtonClick = async (orderId, customer, itemName, itemWeight, packageDimensions, carrierName) => {
  try {
    const response = await axios.get(`http://localhost:8081/trackingData/${orderId}`);
    setTrackingData(response.data.data[0]);
    const trackingData1 = response.data.data[0];
    const originLatLng = { lat: parseFloat(trackingData1.originLat), lng: parseFloat(trackingData1.originLon) }; // San Jose, CA
    const destinationLatLng = { lat: parseFloat(trackingData1.destinationLat), lng: parseFloat(trackingData1.destinationLon) }; // Los Angeles, CA
    const randomLocationBetween = getRandomLocationBetween(originLatLng, destinationLatLng);
    const waypointsLatLng = [originLatLng, randomLocationBetween, destinationLatLng];

    setCurrentOrder({
      orderId,
      customer,
      itemName,
      itemWeight,
      packageDimensions,
      carrierName,
      randomLocation : randomLocationBetween,
      origin: originLatLng,
      destination: destinationLatLng,
      waypoints: waypointsLatLng,
    });

    openStatusDialog();
    setShowMapPopup(true);
  } catch (error) {
    console.error('Error fetching tracking data:', error.message);
  }
};

  const handleCreateLabelClick = () => {
    navigate("/NewOrder");
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  const handleAddToTableClick = () => {
    const logo =
      carrierName === 'UPS'
        ? 'ups.svg'
        : carrierName === 'USPS'
        ? 'usps.svg'
        : carrierName === 'Fedex'
        ? 'fedex.svg'
        : carrierName === 'DHL'
        ? 'dhl.svg'
        : 'cdl.svg';
    axios
      .post('http://localhost:8081/order', {
        customer,
        itemName,
        itemWeight,
        packageDimensions,
        carrierName,
        dateOrdered,
        destination,
        logo,
        price,
      })
      .then((res) => {
        console.log('Response status:', res.status);
        console.log('Response data:', res.data);

        if (res.data === 'Error') {
          console.error('Login failed. Server returned an error:', res.data);
        } else {
          // Process the successful response data
          setSampleData([
            ...sampleData,
            [customer, itemName, itemWeight, packageDimensions, carrierName, dateOrdered, destination, logo, price],
          ]);
          alert('Order placed successfully!');
          setShowPopup(false);
        }
      });
  };

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = (orderId, status) => {
    axios
      .post('http://localhost:8081/updateOrder', { orderId, status })
      .then((res) => {
        console.log('Response status:', res.status);
        console.log('Response data:', res.data);
        alert('Status updated successfully!');
        // Update the status in local state
        setSampleData((prevData) =>
          prevData.map((data) =>
            data.orderId === orderId ? { ...data, status } : data
          )
        );
      });
  };

  const handleShippedButtonClick = () => {
    setShowMapPopup(true);
    simulateOrderProgress();
    console.log('Shipped button clicked!');
  };

  const handleMapPopupClose = () => {
    setCurrentOrder(null);
    setShowMapPopup(false);
  };

  const trackButton = (data) => {
    return (
      <Button onClick={() => handleTrackButtonClick(data.orderId, data.customer, data.itemName, data.itemWeight, data.packageDimensions, data.carrierName)}>
        Track
      </Button>
    );
  };

  //Update code added Manager can Update Order 
  const handleUpdate = (id) => {
    const userToUpdate = sampleData.find((user) => user.orderId === id);
    setSelectedUser(userToUpdate);
    setUpdateFormData(userToUpdate);
  };

  const handleUpdateSubmit = async () => {
    try {
      await axios.put(`http://localhost:8081/Order/${selectedUser.orderId}`, updateFormData);
      // Update the local state with the updated data
      setSampleData((prevUsers) =>
        prevUsers.map((user) =>
          user.orderId === selectedUser.orderId ? { ...user, ...updateFormData } : user
        )
      );
      // Reset the selected user and update form data
      setSelectedUser(null);
      setUpdateFormData({});
      console.log('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };


//Manager can delete order 

  const handleDelete = async (id) => {
    console.log(`Delete user with id ${id}`);
    try {
      await axios.delete(`http://localhost:8081/order/${id}`);
      setSampleData((prevUsers) => prevUsers.filter((sampleData) => sampleData.orderId !== id));
      console.log(`User with id ${id} deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredData = sampleData.filter((data) => {
    const searchRegex = new RegExp(searchTerm, 'i');
    return searchRegex.test(data.orderId) || searchRegex.test(data.customer) || searchRegex.test(data.itemName) || searchRegex.test(data.carrierName);
  });

  return (
    <div style={{ width: '100%' }}>
      <Navbar tab={'orders'} />
      {!selectedUser ?
      (<div className="main-body">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Heading mb={4} textAlign="center">
          Customer Orders
        </Heading>
          <Button onClick={handleCreateLabelClick}>Create a New Shipment Here</Button>
          <Input label="Search" value={searchTerm} placeholder='Search here about order details' onChange={handleSearchTermChange} style={{ marginBottom: '16px' }} /> 
          {filteredData.length > 0 && (
            <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                <Th>OrderId</Th>
                    <Th>Date Ordered</Th>
                    <Th>Customer</Th>
                    <Th>Package Dimensions </Th>
                    <Th>Package Weight </Th>
                    <Th>Carrier</Th>
                    <Th>Price</Th>
                    <Th>From Location</Th>
                    <Th>Destination</Th>
                    <Th>Track</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.map((data) => (
                  <Tr key={data.orderId}>
                      <Td>{data.orderId}</Td>
                      <Td>{data.dateOrdered}</Td>
                      <Td>{data.customer}</Td>
                      <Td>{data.packageDimensions} inches</Td>
                      <Td>{data.itemWeight} lb</Td>
                      <Td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {<img src={data.logo} style={{ width: '30px' }} alt={`${data.carrierName} logo`} />}
                          {data.carrierName}
                        </div>
                      </Td>
                      <Td>{data.price}</Td>
                      <Td>{data.fromLocation}</Td>
                      <Td>{data.destination}</Td>
                      <Td>{trackButton(data)}</Td>                    <Td>
                      <select style={{width:"fit-content"}} value={data.status} onChange={(e) => handleStatusChange(data.orderId, e.target.value)} disabled={data.status === "Delivered"}>
                        <option value="Ordered">Ordered</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </Td>
                    <Td><Button
                          colorScheme="teal"
                          onClick={() => handleUpdate(data.orderId)}
                        >
                          Update
                        </Button>
                        <Button
                          colorScheme="red"
                          marginLeft="2"
                          onClick={() => handleDelete(data.orderId)}
                        >
                          Delete
                        </Button></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          )}
          {filteredData.length === 0 && <p>No matching orders found.</p>}
        </div>
      </div>):( <Box
  width="600px"
  margin="auto"
  marginTop="50px"
  border="1px solid #ddd"
  padding="20px"
  borderRadius="8px"
  boxShadow="md"
>
        <div>
        <VStack align="start" spacing={4}>
        <Input
  type="text"
  name="customer"
  placeholder="Customer"
  value={updateFormData.customer}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      customer: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="itemWeight"
  placeholder="Item Weight"
  value={updateFormData.itemWeight}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      itemWeight: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="packageDimensions"
  placeholder="Package Dimensions"
  value={updateFormData.packageDimensions}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      packageDimensions: e.target.value,
    })
  }
/>

<FormControl mt={4}>
  <FormLabel>Carrier Name:</FormLabel>
  <Select
    name='carrierName'
    value={updateFormData.carrierName}
    onChange={(e) =>
      setUpdateFormData({
        ...updateFormData,
        carrierName: e.target.value,
      })
    }
  >
    <option value='DHL'>DHL</option>
    <option value='CDL'>CDL</option>
    <option value='USPS'>USPS</option>
    <option value='UPS'>UPS</option>
    <option value='FedEx'>FedEx</option>
    {/* Add more options as needed */}
  </Select>
</FormControl>

<Input
  type="text"
  name="dateOrdered"
  placeholder="Date Ordered"
  value={updateFormData.dateOrdered}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      dateOrdered: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="destination"
  placeholder="Destination"
  value={updateFormData.destination}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      destination: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="logo"
  placeholder="Logo"
  value={updateFormData.logo}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      logo: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="price"
  placeholder="Price"
  value={updateFormData.price}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      price: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="phone_number"
  placeholder="Phone Number"
  value={updateFormData.phone_number}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      phone_number: e.target.value,
    })
  }
/>

<Input
  type="email"
  name="email_address"
  placeholder="Email Address"
  value={updateFormData.email_address}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      email_address: e.target.value,
    })
  }
/>

<Input
  type="text"
  name="address"
  placeholder="Address"
  value={updateFormData.address}
  onChange={(e) =>
    setUpdateFormData({
      ...updateFormData,
      address: e.target.value,
    })
  }
/></VStack>
<Button onClick={handleUpdateSubmit}>Update User</Button>
</div>
</Box>
)}

      {currentOrder && (
        <Modal isOpen={showStatusDialog} onClose={closeStatusDialog} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Order Status</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            <OrderStatusDemo trackingData={trackingData} />
              {trackingData.status === 'Shipped' && (
                 <>
                 <Button onClick={handleShippedButtonClick}>Shipped</Button>
                 {showMapPopup && (
                   // Render maps below the "Shipped" button
                   <LoadScript googleMapsApiKey="AIzaSyBLD3HWQnIC_vkojQ6XAdenFaMG8H6bc2c">
                     <GoogleMap
                      key={mapKey}
                      mapContainerStyle={{ width: '100%', height: '400px' }}
                      zoom={8}
                      center={
                        carIconLocation === 'origin'
                          ? currentOrder.origin
                          : carIconLocation === 'random'
                          ? currentOrder.randomLocation
                          : currentOrder.destination
                      }
                    >
                      <Polyline
                        path={[currentOrder.origin, ...currentOrder.waypoints, currentOrder.destination]}
                        options={{ strokeColor: '#0000FF', strokeWeight: 2 }}
                      />
                      <Marker position={currentOrder.origin} label="Origin" />
                      <Marker position={currentOrder.destination} label="Destination" />
                      {carIconLocation === 'origin' && (
                        <Marker
                          position={currentOrder.origin}
                          icon={{
                            url: carIconUrl,
                            scaledSize: { width: 70, height: 70 }, // Move scaledSize inside the icon object
                          }}
                        />
                      )}
                      {carIconLocation === 'random' && (
                        <Marker
                          position={currentOrder.randomLocation}
                          icon={{
                            url: carIconUrl,
                            scaledSize: { width: 50, height: 50 }, // Move scaledSize inside the icon object
                          }}
                        />
                      )}
                      {carIconLocation === 'destination' && (
                        <Marker
                          position={currentOrder.destination}
                          icon={{
                            url: carIconUrl,
                            scaledSize: { width: 70, height: 70 }, // Move scaledSize inside the icon object
                          }}
                        />
                      )}
                    </GoogleMap>
                   </LoadScript>
                 )}
               </>
             )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

export default OrdersManager;
