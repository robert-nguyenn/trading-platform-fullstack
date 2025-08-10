import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getBrokerAlpacaAuth, ALPACA_BASE_URL } from '../../utils/authUtils';
import { PrismaClient } from '@prisma/client';
//fix
const prisma = new PrismaClient();
dotenv.config();

const defaultAccountData = {
    contact: {
        email_address: "joohn.doe@example.com",
        phone_number: "+15556667788",
        street_address: ["123 Main St"],
        city: "San Mateo",
        state: "CA",
        postal_code: "94401"
    },
    identity: {
        tax_id_type: "USA_SSN",
        given_name: "John",
        family_name: "Doe",
        date_of_birth: "1990-01-01",
        tax_id: "123-45-3456",
        country_of_citizenship: "USA",
        country_of_birth: "USA",
        country_of_tax_residence: "USA",
        funding_source: ["employment_income"]
    },
    disclosures: {
        is_control_person: false,
        is_affiliated_exchange_or_finra: false,
        is_politically_exposed: false,
        immediate_family_exposed: false
    },
    trusted_contact: {
        given_name: "Trusted",
        family_name: "Contact",
        email_address: "trusted@example.com"
    },
    account_type: "trading",
    agreements: [
        {
            agreement: "customer_agreement",
            signed_at: "2023-01-01T00:00:00Z", // Static example timestamp
            ip_address: "127.0.0.1"
        }
    ],
    documents: [],
    enabled_assets: ["us_equity"],
    beneficiaries: []
};


export const createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        // Extract email, given_name, family_name, and id from req.body
        const { email, given_name, family_name, id } = req.body;

        // Validate required fields
        if (!email || !given_name || !family_name || !id) {
            res.status(400).json({
                error: 'The fields email, given_name, family_name, and id are required.'
            });
            return;
        }

        // Merge default data with provided fields
        const accountData = {
            ...defaultAccountData,
            contact: {
                ...defaultAccountData.contact,
                email_address: email
            },
            identity: {
                ...defaultAccountData.identity,
                given_name,
                family_name
            }
        };

        // Step 1: Create the account in Alpaca
        const accountResponse = await axios.post(
            `${ALPACA_BASE_URL}/accounts`,
            accountData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        const account = accountResponse.data; // The created account
        const accountId = account.id; // Extract the account ID

        // Step 2: Create an ACH relationship for the account
        const achRelationshipData = {
            account_owner_name: `${given_name} ${family_name}`,
            bank_account_type: "CHECKING",
            bank_account_number: "123456789ab", // Example bank account number
            bank_routing_number: "123456780", // Example routing number
            nickname: "Bank of America Checking"
        };

        const achResponse = await axios.post(
            `${ALPACA_BASE_URL}/accounts/${accountId}/ach_relationships`,
            achRelationshipData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        const achRelationship = achResponse.data; // The created ACH relationship
        const relationshipId = achRelationship.id; // Extract the relationship ID

        // Step 3: Fund the account with a default amount of 50000
        const fundData = {
            transfer_type: "ach",
            direction: "INCOMING",
            timing: "immediate",
            relationship_id: relationshipId,
            amount: "50000"
        };

        await axios.post(
            `${ALPACA_BASE_URL}/accounts/${accountId}/transfers`,
            fundData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Step 4: Create a user in the database
        const userResponse = await prisma.user.create({
            data: {
                id,// Use the id provided in the request body
                email,
                tradingId: accountId // Store the Alpaca account ID in the database
            }
        });

        // Respond with the created account and ACH relationship
        res.status(201).json({
            account,
            achRelationship,
            userResponse,
            message: 'Account created, ACH relationship established, and account funded successfully.'
        });
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};
export const getAllAccounts = async(req: Request, res: Response) => {
    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Upload owner document for an existing account
export const uploadOwnerDocument = async (req: Request, res: Response) => {
    const { account_id, document_type, document_sub_type, content, mime_type } = req.body;

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/accounts/${account_id}/documents/upload`,
            {
                document_type,
                document_sub_type,
                content,
                mime_type
            },
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Get account by ID
export const getAccountById = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                },
            }
        );
        res.json(response.data);

    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Delete a Bank Relationship for an Account
export const deleteBankRelationship = async (req: Request, res: Response) => {
    const { account_id, bank_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/v1/accounts/${account_id}/recipient_banks/${bank_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth()
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Update an Account
export const updateAccount = async (req: Request, res: Response) => {
    const { account_id } = req.params;
    const { identity, disclosures } = req.body;

    try {
        const response = await axios.patch(
            `${ALPACA_BASE_URL}/v1/accounts/${account_id}`,
            { identity, disclosures },
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Request to Close a Transfer
export const closeTransfer = async (req: Request, res: Response) => {
    const { account_id, transfer_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/v1/accounts/${account_id}/transfers/${transfer_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth()
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Retrieve Account Activities
export const getAccountActivities = async (req: Request, res: Response) => {
    const { page_size } = req.query;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/activities`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                },
                params: {
                    page_size
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Retrieve ACH Relationships for an Account
export const getAchRelationships = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}/ach_relationships`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Create an ACH Relationship
export const createAchRelationship = async (req: Request, res: Response): Promise<void> => {
    console.warn('createAchRelationship called with body:', req.body); // Log the request body
    const { account_id } = req.params;
    const {
        account_owner_name,
        bank_account_type,
        bank_account_number,
        bank_routing_number,
        nickname,
        processor_token,
        instant
    } = req.body;

    // Validate required fields
    if (!account_owner_name || !bank_account_type || !bank_account_number || !bank_routing_number) {
        res.status(400).json({
            error: 'The fields account_owner_name, bank_account_type, bank_account_number, and bank_routing_number are required.'
        });
        return;
    }

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/accounts/${account_id}/ach_relationships`,
            {
                account_owner_name,
                bank_account_type,
                bank_account_number,
                bank_routing_number,
                nickname, // Optional
                processor_token, // Optional
                instant // Optional
            },
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.status(201).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};
// Delete an existing ACH relationship
export const deleteAchRelationship = async (req: Request, res: Response) => {
    const { account_id, ach_relationship_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/v1/accounts/${account_id}/ach_relationships/${ach_relationship_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth()
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Get Pattern Day Trader Status for an Account
export const getPdtStatus = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/v1/trading/accounts/${account_id}/account/pdt/status`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Exercise PDT one-time removal
export const exercisePdtOneTimeRemoval = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/v1/trading/accounts/${account_id}/account/pdt/one-time-removal`,
            {},
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Close an Account
export const closeAccount = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/v1/accounts/${account_id}/actions/close`,
            {},
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth()
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

//FUNDING AN ACCOUNT PAPER TRADING LIMIT
export const fundAccount = async (req: Request, res: Response): Promise<void> => {
    const { account_id } = req.params;
    const {
        transfer_type,
        direction,
        timing,
        relationship_id,
        amount
    } = req.body;

    // Validate required fields
    if (!transfer_type || !direction || !timing || !relationship_id || !amount) {
        res.status(400).json({
            error: 'The fields transfer_type, direction, timing, relationship_id, and amount are required.'
        });
        return;
    }

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/accounts/${account_id}/transfers`,
            {
                transfer_type,
                direction,
                timing,
                relationship_id,
                amount
            },
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.status(201).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

export const getAccountBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Get user ID from authenticated user object (populated by middleware)
        const firebaseUser = req.user; // Assuming middleware adds 'user' to Request
        const userId = firebaseUser?.uid;

        if (!userId) {
            res.status(400).json({ error: 'User ID is required.' });
            return;
        }

        // Fetch the user from the database to get the tradingID
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.tradingId) {
            res.status(404).json({ error: 'User or trading ID not found.' });
            return;
        }

        const tradingID = user.tradingId;

        // Call Alpaca's /v1/trading/accounts/{tradingID}/account endpoint
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${tradingID}/account`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                },
            }
        );

        const accountData = response.data;

        // Extract the buying_power field
        const buyingPower = accountData?.buying_power || '0'; // Default to '0' if not found

        // Return the buying_power field
        res.status(200).json({ buying_power: buyingPower, portfolio_value: accountData.portfolio_value });  
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

