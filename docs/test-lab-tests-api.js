// Test script for Lab Tests API endpoints
// Run this in browser console on http://localhost:3000

async function testLabTestsAPI() {
  console.log('🧪 Testing Lab Tests API endpoints...\n');
  
  try {
    // Test 1: Lab Tests Dropdown
    console.log('1️⃣ Testing Lab Tests Dropdown (GET /api/dropdown/lab-tests)');
    const dropdownResponse = await fetch('/api/dropdown/lab-tests', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (dropdownResponse.ok) {
      const dropdownData = await dropdownResponse.json();
      console.log('✅ Dropdown loaded successfully:', dropdownData.length, 'lab tests');
      console.log('   Sample:', dropdownData[0]);
    } else {
      console.log('❌ Dropdown failed:', dropdownResponse.status);
    }
    
    console.log('');
    
    // Test 2: Get Visit Lab Tests
    const visitId = 'test-visit-123';
    console.log(`2️⃣ Testing Get Visit Lab Tests (GET /api/visit-lab-test?visitId=${visitId})`);
    const getResponse = await fetch(`/api/visit-lab-test?visitId=${visitId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Get lab tests successful:', getData.length, 'lab tests found');
    } else {
      console.log('❌ Get lab tests failed:', getResponse.status);
    }
    
    console.log('');
    
    // Test 3: Add Lab Test
    console.log('3️⃣ Testing Add Lab Test (POST /api/visit-lab-test)');
    const addResponse = await fetch('/api/visit-lab-test', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visitId: visitId,
        labTestId: '1',
        description: 'Test lab test description'
      })
    });
    
    if (addResponse.ok) {
      const addData = await addResponse.json();
      console.log('✅ Add lab test successful:', addData);
    } else {
      console.log('❌ Add lab test failed:', addResponse.status);
    }
    
    console.log('');
    
    // Test 4: Delete Lab Test
    const testId = 'test-lab-test-123';
    console.log(`4️⃣ Testing Delete Lab Test (DELETE /api/visit-lab-test/lab-tests/${testId})`);
    const deleteResponse = await fetch(`/api/visit-lab-test/lab-tests/${testId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Delete lab test successful:', deleteData);
    } else {
      console.log('❌ Delete lab test failed:', deleteResponse.status);
    }
    
    console.log('\n🎉 Lab Tests API testing completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the tests
testLabTestsAPI();
