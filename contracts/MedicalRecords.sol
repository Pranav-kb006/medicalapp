// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalRecords
 * @dev A smart contract for managing medical records with IPFS CIDs
 * @notice Users can store medical document CIDs, and approved doctors can access them
 */
contract MedicalRecords {
    
    // ============ State Variables ============
    
    address public admin;
    
    // Mapping from user address to their array of document CIDs
    mapping(address => string[]) private userRecords;
    
    // Mapping to track registered doctors (address => isDoctor)
    mapping(address => bool) public isDoctor;
    
    // Mapping to track doctor approvals by users (user => doctor => isApproved)
    mapping(address => mapping(address => bool)) private doctorApprovals;
    
    // Array to keep track of all registered doctors
    address[] public doctorList;
    
    // ============ Events ============
    
    event RecordAdded(address indexed user, string cid, uint256 index);
    event RecordDeleted(address indexed user, string cid, uint256 index);
    event DoctorRegistered(address indexed doctor);
    event DoctorRemoved(address indexed doctor);
    event DoctorApproved(address indexed user, address indexed doctor);
    event DoctorRevoked(address indexed user, address indexed doctor);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyDoctor() {
        require(isDoctor[msg.sender], "Only registered doctors can perform this action");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        admin = msg.sender;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Register a new doctor (admin only)
     * @param _doctor The address of the doctor to register
     */
    function registerDoctor(address _doctor) external onlyAdmin {
        require(_doctor != address(0), "Invalid doctor address");
        require(!isDoctor[_doctor], "Doctor already registered");
        
        isDoctor[_doctor] = true;
        doctorList.push(_doctor);
        
        emit DoctorRegistered(_doctor);
    }
    
    /**
     * @dev Remove a doctor from the registry (admin only)
     * @param _doctor The address of the doctor to remove
     */
    function removeDoctor(address _doctor) external onlyAdmin {
        require(isDoctor[_doctor], "Address is not a registered doctor");
        
        isDoctor[_doctor] = false;
        
        // Remove from doctorList array
        for (uint256 i = 0; i < doctorList.length; i++) {
            if (doctorList[i] == _doctor) {
                doctorList[i] = doctorList[doctorList.length - 1];
                doctorList.pop();
                break;
            }
        }
        
        emit DoctorRemoved(_doctor);
    }
    
    /**
     * @dev Transfer admin rights to a new address
     * @param _newAdmin The address of the new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid new admin address");
        
        address previousAdmin = admin;
        admin = _newAdmin;
        
        emit AdminTransferred(previousAdmin, _newAdmin);
    }
    
    // ============ User Functions ============
    
    /**
     * @dev Add a medical record (IPFS CID) for the calling user
     * @param _cid The IPFS Content Identifier of the medical document
     */
    function addRecord(string calldata _cid) external {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        
        userRecords[msg.sender].push(_cid);
        uint256 index = userRecords[msg.sender].length - 1;
        
        emit RecordAdded(msg.sender, _cid, index);
    }
    
    /**
     * @dev Delete a medical record by index
     * @param _index The index of the record to delete
     */
    function deleteRecord(uint256 _index) external {
        require(_index < userRecords[msg.sender].length, "Invalid record index");
        
        string memory deletedCid = userRecords[msg.sender][_index];
        
        // Move the last element to the deleted position and pop
        uint256 lastIndex = userRecords[msg.sender].length - 1;
        if (_index != lastIndex) {
            userRecords[msg.sender][_index] = userRecords[msg.sender][lastIndex];
        }
        userRecords[msg.sender].pop();
        
        emit RecordDeleted(msg.sender, deletedCid, _index);
    }
    
    /**
     * @dev Approve a doctor to access your records
     * @param _doctor The address of the doctor to approve
     */
    function approveDoctor(address _doctor) external {
        require(isDoctor[_doctor], "Address is not a registered doctor");
        require(!doctorApprovals[msg.sender][_doctor], "Doctor already approved");
        
        doctorApprovals[msg.sender][_doctor] = true;
        
        emit DoctorApproved(msg.sender, _doctor);
    }
    
    /**
     * @dev Revoke a doctor's access to your records
     * @param _doctor The address of the doctor to revoke access from
     */
    function revokeDoctor(address _doctor) external {
        require(doctorApprovals[msg.sender][_doctor], "Doctor not approved");
        
        doctorApprovals[msg.sender][_doctor] = false;
        
        emit DoctorRevoked(msg.sender, _doctor);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get your own medical records
     * @return Array of IPFS CIDs
     */
    function getMyRecords() external view returns (string[] memory) {
        return userRecords[msg.sender];
    }
    
    /**
     * @dev Get the number of records for the calling user
     * @return The count of records
     */
    function getMyRecordCount() external view returns (uint256) {
        return userRecords[msg.sender].length;
    }
    
    /**
     * @dev Get a specific record by index for the calling user
     * @param _index The index of the record
     * @return The IPFS CID at the given index
     */
    function getMyRecordByIndex(uint256 _index) external view returns (string memory) {
        require(_index < userRecords[msg.sender].length, "Invalid record index");
        return userRecords[msg.sender][_index];
    }
    
    /**
     * @dev Check if a doctor is approved to access your records
     * @param _doctor The doctor's address to check
     * @return Boolean indicating if the doctor is approved
     */
    function isDoctorApproved(address _doctor) external view returns (bool) {
        return doctorApprovals[msg.sender][_doctor];
    }
    
    /**
     * @dev Get a patient's records (doctor only, must be approved)
     * @param _patient The address of the patient
     * @return Array of IPFS CIDs
     */
    function getPatientRecords(address _patient) external view onlyDoctor returns (string[] memory) {
        require(doctorApprovals[_patient][msg.sender], "You are not approved to access this patient's records");
        return userRecords[_patient];
    }
    
    /**
     * @dev Get the count of a patient's records (doctor only, must be approved)
     * @param _patient The address of the patient
     * @return The count of records
     */
    function getPatientRecordCount(address _patient) external view onlyDoctor returns (uint256) {
        require(doctorApprovals[_patient][msg.sender], "You are not approved to access this patient's records");
        return userRecords[_patient].length;
    }
    
    /**
     * @dev Check if caller has access to a patient's records
     * @param _patient The address of the patient
     * @return Boolean indicating if caller can access the patient's records
     */
    function canAccessPatient(address _patient) external view returns (bool) {
        return isDoctor[msg.sender] && doctorApprovals[_patient][msg.sender];
    }
    
    /**
     * @dev Get all registered doctors
     * @return Array of doctor addresses
     */
    function getAllDoctors() external view returns (address[] memory) {
        return doctorList;
    }
    
    /**
     * @dev Get the total number of registered doctors
     * @return The count of doctors
     */
    function getDoctorCount() external view returns (uint256) {
        return doctorList.length;
    }
}
