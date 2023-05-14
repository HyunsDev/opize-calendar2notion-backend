export type Migration1PaymentEntity = {
    id: number;
    userPlan: string;
    lastPaymentStatus: string;
    paymentIntervalMonths: string;
    isUnlimited: string;
    lastPaymentTime: string;
    nextPaymentTime: string;

    createdAt: string;
    updatedAt: string;
    userId: number;
};
