const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords", function () {
    let MedicalRecords;
    let medicalRecords;
    let admin, doctor1, doctor2, patient1, patient2;

    const sampleCID1 = "QmX4zdJ7xrwZ8VXJfjhG3tqCqM7GnP9ZpB3BoN8vMSHjQa";
    const sampleCID2 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const sampleCID3 = "QmZoZ5xKRBqJh1dXJfxgPzTSjqH2qM1PJhYc3gYRNvHxEp";

    beforeEach(async function () {
        [admin, doctor1, doctor2, patient1, patient2] = await ethers.getSigners();

        MedicalRecords = await ethers.getContractFactory("MedicalRecords");
        medicalRecords = await MedicalRecords.deploy();
        await medicalRecords.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the deployer as admin", async function () {
            expect(await medicalRecords.admin()).to.equal(admin.address);
        });

        it("Should have no doctors initially", async function () {
            expect(await medicalRecords.getDoctorCount()).to.equal(0);
        });
    });

    describe("Admin Functions", function () {
        describe("registerDoctor", function () {
            it("Should allow admin to register a doctor", async function () {
                await expect(medicalRecords.registerDoctor(doctor1.address))
                    .to.emit(medicalRecords, "DoctorRegistered")
                    .withArgs(doctor1.address);

                expect(await medicalRecords.isDoctor(doctor1.address)).to.be.true;
                expect(await medicalRecords.getDoctorCount()).to.equal(1);
            });

            it("Should revert if non-admin tries to register a doctor", async function () {
                await expect(
                    medicalRecords.connect(patient1).registerDoctor(doctor1.address)
                ).to.be.revertedWith("Only admin can perform this action");
            });

            it("Should revert if doctor is already registered", async function () {
                await medicalRecords.registerDoctor(doctor1.address);
                await expect(
                    medicalRecords.registerDoctor(doctor1.address)
                ).to.be.revertedWith("Doctor already registered");
            });

            it("Should revert for zero address", async function () {
                await expect(
                    medicalRecords.registerDoctor(ethers.ZeroAddress)
                ).to.be.revertedWith("Invalid doctor address");
            });
        });

        describe("removeDoctor", function () {
            beforeEach(async function () {
                await medicalRecords.registerDoctor(doctor1.address);
                await medicalRecords.registerDoctor(doctor2.address);
            });

            it("Should allow admin to remove a doctor", async function () {
                await expect(medicalRecords.removeDoctor(doctor1.address))
                    .to.emit(medicalRecords, "DoctorRemoved")
                    .withArgs(doctor1.address);

                expect(await medicalRecords.isDoctor(doctor1.address)).to.be.false;
                expect(await medicalRecords.getDoctorCount()).to.equal(1);
            });

            it("Should revert if non-admin tries to remove a doctor", async function () {
                await expect(
                    medicalRecords.connect(patient1).removeDoctor(doctor1.address)
                ).to.be.revertedWith("Only admin can perform this action");
            });

            it("Should revert if address is not a registered doctor", async function () {
                await expect(
                    medicalRecords.removeDoctor(patient1.address)
                ).to.be.revertedWith("Address is not a registered doctor");
            });
        });

        describe("transferAdmin", function () {
            it("Should allow admin to transfer admin rights", async function () {
                await expect(medicalRecords.transferAdmin(doctor1.address))
                    .to.emit(medicalRecords, "AdminTransferred")
                    .withArgs(admin.address, doctor1.address);

                expect(await medicalRecords.admin()).to.equal(doctor1.address);
            });

            it("Should revert for zero address", async function () {
                await expect(
                    medicalRecords.transferAdmin(ethers.ZeroAddress)
                ).to.be.revertedWith("Invalid new admin address");
            });
        });

        describe("getAllDoctors", function () {
            it("Should return all registered doctors", async function () {
                await medicalRecords.registerDoctor(doctor1.address);
                await medicalRecords.registerDoctor(doctor2.address);

                const doctors = await medicalRecords.getAllDoctors();
                expect(doctors.length).to.equal(2);
                expect(doctors).to.include(doctor1.address);
                expect(doctors).to.include(doctor2.address);
            });
        });
    });

    describe("User Record Functions", function () {
        describe("addRecord", function () {
            it("Should allow user to add a record", async function () {
                await expect(medicalRecords.connect(patient1).addRecord(sampleCID1))
                    .to.emit(medicalRecords, "RecordAdded")
                    .withArgs(patient1.address, sampleCID1, 0);

                const records = await medicalRecords.connect(patient1).getMyRecords();
                expect(records.length).to.equal(1);
                expect(records[0]).to.equal(sampleCID1);
            });

            it("Should allow user to add multiple records", async function () {
                await medicalRecords.connect(patient1).addRecord(sampleCID1);
                await medicalRecords.connect(patient1).addRecord(sampleCID2);
                await medicalRecords.connect(patient1).addRecord(sampleCID3);

                const records = await medicalRecords.connect(patient1).getMyRecords();
                expect(records.length).to.equal(3);
            });

            it("Should revert for empty CID", async function () {
                await expect(
                    medicalRecords.connect(patient1).addRecord("")
                ).to.be.revertedWith("CID cannot be empty");
            });
        });

        describe("deleteRecord", function () {
            beforeEach(async function () {
                await medicalRecords.connect(patient1).addRecord(sampleCID1);
                await medicalRecords.connect(patient1).addRecord(sampleCID2);
                await medicalRecords.connect(patient1).addRecord(sampleCID3);
            });

            it("Should allow user to delete a record", async function () {
                await expect(medicalRecords.connect(patient1).deleteRecord(1))
                    .to.emit(medicalRecords, "RecordDeleted")
                    .withArgs(patient1.address, sampleCID2, 1);

                const records = await medicalRecords.connect(patient1).getMyRecords();
                expect(records.length).to.equal(2);
            });

            it("Should swap last element when deleting non-last", async function () {
                await medicalRecords.connect(patient1).deleteRecord(0);
                const records = await medicalRecords.connect(patient1).getMyRecords();

                expect(records.length).to.equal(2);
                expect(records[0]).to.equal(sampleCID3); // Last element moved to index 0
                expect(records[1]).to.equal(sampleCID2);
            });

            it("Should revert for invalid index", async function () {
                await expect(
                    medicalRecords.connect(patient1).deleteRecord(10)
                ).to.be.revertedWith("Invalid record index");
            });
        });

        describe("getMyRecords", function () {
            it("Should return empty array for user with no records", async function () {
                const records = await medicalRecords.connect(patient1).getMyRecords();
                expect(records.length).to.equal(0);
            });

            it("Should return correct record count", async function () {
                await medicalRecords.connect(patient1).addRecord(sampleCID1);
                await medicalRecords.connect(patient1).addRecord(sampleCID2);

                expect(await medicalRecords.connect(patient1).getMyRecordCount()).to.equal(2);
            });

            it("Should return correct record by index", async function () {
                await medicalRecords.connect(patient1).addRecord(sampleCID1);
                await medicalRecords.connect(patient1).addRecord(sampleCID2);

                expect(await medicalRecords.connect(patient1).getMyRecordByIndex(1)).to.equal(sampleCID2);
            });
        });
    });

    describe("Doctor Approval Functions", function () {
        beforeEach(async function () {
            await medicalRecords.registerDoctor(doctor1.address);
            await medicalRecords.registerDoctor(doctor2.address);
            await medicalRecords.connect(patient1).addRecord(sampleCID1);
            await medicalRecords.connect(patient1).addRecord(sampleCID2);
        });

        describe("approveDoctor", function () {
            it("Should allow patient to approve a doctor", async function () {
                await expect(medicalRecords.connect(patient1).approveDoctor(doctor1.address))
                    .to.emit(medicalRecords, "DoctorApproved")
                    .withArgs(patient1.address, doctor1.address);
            });

            it("Should revert if address is not a doctor", async function () {
                await expect(
                    medicalRecords.connect(patient1).approveDoctor(patient2.address)
                ).to.be.revertedWith("Address is not a registered doctor");
            });

            it("Should revert if doctor already approved", async function () {
                await medicalRecords.connect(patient1).approveDoctor(doctor1.address);
                await expect(
                    medicalRecords.connect(patient1).approveDoctor(doctor1.address)
                ).to.be.revertedWith("Doctor already approved");
            });
        });

        describe("revokeDoctor", function () {
            beforeEach(async function () {
                await medicalRecords.connect(patient1).approveDoctor(doctor1.address);
            });

            it("Should allow patient to revoke a doctor", async function () {
                await expect(medicalRecords.connect(patient1).revokeDoctor(doctor1.address))
                    .to.emit(medicalRecords, "DoctorRevoked")
                    .withArgs(patient1.address, doctor1.address);
            });

            it("Should revert if doctor not approved", async function () {
                await expect(
                    medicalRecords.connect(patient1).revokeDoctor(doctor2.address)
                ).to.be.revertedWith("Doctor not approved");
            });
        });

        describe("isDoctorApproved", function () {
            it("Should return true for approved doctor", async function () {
                await medicalRecords.connect(patient1).approveDoctor(doctor1.address);
                expect(await medicalRecords.connect(patient1).isDoctorApproved(doctor1.address)).to.be.true;
            });

            it("Should return false for non-approved doctor", async function () {
                expect(await medicalRecords.connect(patient1).isDoctorApproved(doctor1.address)).to.be.false;
            });
        });
    });

    describe("Doctor Access Functions", function () {
        beforeEach(async function () {
            await medicalRecords.registerDoctor(doctor1.address);
            await medicalRecords.registerDoctor(doctor2.address);
            await medicalRecords.connect(patient1).addRecord(sampleCID1);
            await medicalRecords.connect(patient1).addRecord(sampleCID2);
        });

        describe("getPatientRecords", function () {
            it("Should allow approved doctor to access patient records", async function () {
                await medicalRecords.connect(patient1).approveDoctor(doctor1.address);

                const records = await medicalRecords.connect(doctor1).getPatientRecords(patient1.address);
                expect(records.length).to.equal(2);
                expect(records[0]).to.equal(sampleCID1);
                expect(records[1]).to.equal(sampleCID2);
            });

            it("Should revert if doctor is not approved", async function () {
                await expect(
                    medicalRecords.connect(doctor1).getPatientRecords(patient1.address)
                ).to.be.revertedWith("You are not approved to access this patient's records");
            });

            it("Should revert if caller is not a doctor", async function () {
                await expect(
                    medicalRecords.connect(patient2).getPatientRecords(patient1.address)
                ).to.be.revertedWith("Only registered doctors can perform this action");
            });
        });

        describe("getPatientRecordCount", function () {
            it("Should return correct count for approved doctor", async function () {
                await medicalRecords.connect(patient1).approveDoctor(doctor1.address);

                const count = await medicalRecords.connect(doctor1).getPatientRecordCount(patient1.address);
                expect(count).to.equal(2);
            });
        });

        describe("canAccessPatient", function () {
            it("Should return true for approved doctor", async function () {
                await medicalRecords.connect(patient1).approveDoctor(doctor1.address);
                expect(await medicalRecords.connect(doctor1).canAccessPatient(patient1.address)).to.be.true;
            });

            it("Should return false for non-approved doctor", async function () {
                expect(await medicalRecords.connect(doctor1).canAccessPatient(patient1.address)).to.be.false;
            });

            it("Should return false for non-doctor", async function () {
                expect(await medicalRecords.connect(patient2).canAccessPatient(patient1.address)).to.be.false;
            });
        });
    });

    describe("Edge Cases", function () {
        it("Should handle doctor removal revoking all patient access", async function () {
            await medicalRecords.registerDoctor(doctor1.address);
            await medicalRecords.connect(patient1).addRecord(sampleCID1);
            await medicalRecords.connect(patient1).approveDoctor(doctor1.address);

            // Doctor can access before removal
            const recordsBefore = await medicalRecords.connect(doctor1).getPatientRecords(patient1.address);
            expect(recordsBefore.length).to.equal(1);

            // Remove doctor
            await medicalRecords.removeDoctor(doctor1.address);

            // Doctor can no longer access (not a doctor anymore)
            await expect(
                medicalRecords.connect(doctor1).getPatientRecords(patient1.address)
            ).to.be.revertedWith("Only registered doctors can perform this action");
        });

        it("Should allow multiple patients to approve same doctor", async function () {
            await medicalRecords.registerDoctor(doctor1.address);

            await medicalRecords.connect(patient1).addRecord(sampleCID1);
            await medicalRecords.connect(patient2).addRecord(sampleCID2);

            await medicalRecords.connect(patient1).approveDoctor(doctor1.address);
            await medicalRecords.connect(patient2).approveDoctor(doctor1.address);

            const records1 = await medicalRecords.connect(doctor1).getPatientRecords(patient1.address);
            const records2 = await medicalRecords.connect(doctor1).getPatientRecords(patient2.address);

            expect(records1[0]).to.equal(sampleCID1);
            expect(records2[0]).to.equal(sampleCID2);
        });
    });
});
