// MedicalRecords Smart Contract ABI
export const MEDICAL_RECORDS_ABI = [
  // Events
  "event RecordAdded(address indexed user, string cid, uint256 index)",
  "event RecordDeleted(address indexed user, string cid, uint256 index)",
  "event DoctorRegistered(address indexed doctor)",
  "event DoctorRemoved(address indexed doctor)",
  "event DoctorApproved(address indexed user, address indexed doctor)",
  "event DoctorRevoked(address indexed user, address indexed doctor)",

  // Admin functions
  "function admin() view returns (address)",
  "function registerDoctor(address _doctor)",
  "function removeDoctor(address _doctor)",
  "function transferAdmin(address _newAdmin)",

  // User functions
  "function addRecord(string calldata _cid)",
  "function deleteRecord(uint256 _index)",
  "function approveDoctor(address _doctor)",
  "function revokeDoctor(address _doctor)",
  "function getMyRecords() view returns (string[])",
  "function getMyRecordCount() view returns (uint256)",
  "function getMyRecordByIndex(uint256 _index) view returns (string)",
  "function isDoctorApproved(address _doctor) view returns (bool)",

  // Doctor functions
  "function isDoctor(address) view returns (bool)",
  "function getPatientRecords(address _patient) view returns (string[])",
  "function getPatientRecordCount(address _patient) view returns (uint256)",
  "function canAccessPatient(address _patient) view returns (bool)",

  // View functions
  "function getAllDoctors() view returns (address[])",
  "function getDoctorCount() view returns (uint256)",
];
