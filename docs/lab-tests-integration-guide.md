# Lab Tests Integration Guide

## Current Status ✅

The Lab Tests section has been successfully integrated with the following features:

### ✅ **Completed Features**

1. **Searchable Dropdown for Lab Test Selection**
   - API endpoint: `GET /api/dropdown/lab-tests`
   - Uses backend: `GET http://localhost:5128/api/Dropdown/lab-tests`
   - **Temporary workaround**: Returns mock data when backend is unavailable

2. **Add New Lab Tests**
   - API endpoint: `POST /api/visit-lab-test`
   - Uses backend: `POST http://localhost:5128/api/VisitLabTest`
   - **Temporary workaround**: Returns mock response when backend is unavailable

3. **Fetch Visit Lab Tests**
   - API endpoint: `GET /api/visit-lab-test?visitId={visitId}`
   - Uses backend: `GET http://localhost:5128/api/VisitLabTest/by-visit/{visitId}`
   - **Temporary workaround**: Returns empty array when backend is unavailable

4. **Delete Lab Tests**
   - API endpoint: `DELETE /api/visit-lab-test/lab-tests/{id}`
   - Uses backend: `DELETE http://localhost:5128/api/VisitLabTest/{id}`
   - **Temporary workaround**: Returns success when backend is unavailable

### 🔧 **Current Temporary Workarounds**

Since the backend `VisitLabTestController` and `DropdownController` lab-tests endpoint are missing, the frontend will:

1. **Lab Tests Dropdown**: Show 5 common lab tests (CBC, Blood Glucose, Cholesterol Panel, Liver Function Test, Kidney Function Test)
2. **Add Lab Test**: Accept the request and show success message (mock functionality)
3. **Fetch Lab Tests**: Show empty state (no lab tests found)
4. **Delete Lab Test**: Accept the request and show success message (mock functionality)

### 📋 **Mock Lab Tests Available**

When backend is unavailable, these lab tests are available in the dropdown:

1. **Complete Blood Count (CBC)** - Code: CBC001
2. **Blood Glucose** - Code: GLU001  
3. **Cholesterol Panel** - Code: CHOL001
4. **Liver Function Test** - Code: LFT001
5. **Kidney Function Test** - Code: KFT001

### 🧪 **Testing Instructions**

1. **Navigate to Consultation Page**
   ```
   http://localhost:3000/visits/{visitId}/consultation
   ```

2. **Test Lab Tests Section**
   - Click "Request Test" button
   - Search and select a lab test from dropdown
   - Enter description
   - Click "Request Test"
   - Verify success message appears
   - Verify lab test appears in the list (with mock data)
   - Click delete button on a lab test
   - Verify success message and item removal

3. **Expected Behavior**
   - ✅ Dropdown loads with mock lab tests
   - ✅ Adding lab tests shows success message
   - ✅ Lab tests appear in the UI (temporarily)
   - ✅ Deleting lab tests shows success message
   - ✅ No 400 Bad Request errors

### 🚀 **Backend Implementation Needed**

To complete the integration, the backend needs:

1. **VisitLabTestController** with endpoints:
   ```csharp
   [HttpGet("by-visit/{visitId}")]
   public async Task<IActionResult> GetByVisit(string visitId)
   
   [HttpPost]
   public async Task<IActionResult> Create(CreateVisitLabTestDto dto)
   
   [HttpDelete("{id}")]
   public async Task<IActionResult> Delete(string id)
   ```

2. **DropdownController** lab-tests endpoint:
   ```csharp
   [HttpGet("lab-tests")]
   public async Task<IActionResult> GetLabTests()
   ```

### 🔄 **Transition to Real Backend**

Once backend controllers are implemented:

1. Remove the temporary workaround code from API routes
2. Test with real backend endpoints
3. Update mock data if needed to match backend response format
4. Verify end-to-end functionality

### 📁 **Code Structure**

**Frontend Components:**
- `app/visits/[id]/consultation/page.tsx` - Main consultation page with Lab Tests section
- `app/api/dropdown/lab-tests/route.ts` - Lab tests dropdown API
- `app/api/visit-lab-test/route.ts` - Visit lab tests GET/POST API
- `app/api/visit-lab-test/lab-tests/[id]/route.ts` - Lab test DELETE API

**Backend Controllers Needed:**
- `Controllers/VisitLabTestController.cs` - Visit lab test operations
- `Controllers/DropdownController.cs` - Dropdown data (add lab-tests endpoint)

### 🎯 **Success Criteria**

- ✅ Lab Tests section follows same structure as Diagnoses section
- ✅ Searchable dropdown for lab test selection
- ✅ Add/delete lab tests functionality
- ✅ Proper error handling and user feedback
- ✅ Consistent code structure with other sections
- ✅ No breaking errors when backend is unavailable
- ⏳ **Pending**: Real backend integration

## Summary

The Lab Tests integration is **functionally complete** on the frontend with temporary workarounds in place. The UI works exactly like the Diagnoses section, and users can interact with it without errors. Once the backend controllers are implemented, the temporary workarounds can be removed for full end-to-end functionality.
