# Database schema alignment

The data model follows the requirements in `WDP_Group 4.docx` while avoiding duplicate collections.

| Area                        | Collections                                                       | Design decision                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and access         | `User`, `TenantProfile`, `OtpChallenge`, `EmailDelivery`          | A tenant profile carries renter-only details; OTP and email delivery support verification and recovery.                                                 |
| Property operations         | `Building`, `Room`, `ServiceFee`, `UtilityRate`, `ContractPolicy` | Buildings own manager assignments. Rooms retain physical amenities and assigned service fees; pricing and policy data are versioned or effective-dated. |
| Rental lifecycle            | `RentalRequest`, `Contract`, `UtilityReading`                     | A contract snapshots the relevant fee and payment policy terms to preserve historical accuracy.                                                         |
| Billing and payment         | `Invoice`, `Payment`, `PaymentEvent`, `DepositTransaction`        | Invoice adjustments are embedded for one invoice instead of a separate adjustment collection. Gateway events remain separate for idempotency.           |
| Check-out and communication | `CheckoutRequest`, `CheckoutSettlement`, `Notification`           | Settlement stores inspection, debt, deposit calculation and refund confirmation together.                                                               |

`AuditLog` was removed because it has no defined use case in the supplied SRS and no application code uses it. The existing MongoDB `auditlogs` collection is intentionally not dropped automatically so historical data is not destroyed.

## Demo data for Compass

Dữ liệu mẫu đã được chèn trực tiếp vào MongoDB để Compass có thể hiển thị trường dữ liệu và suy luận quan hệ. Các tài khoản mẫu dùng mật khẩu `DemoPassword123!`:

- `landlord.demo@smartrental.local`
- `manager.demo@smartrental.local`
- `tenant.demo@smartrental.local`

## Key rules

- `Room.status` supports `VACANT`, `RESERVED`, `OCCUPIED`, and `MAINTENANCE`.
- A room can declare amenities and reference the active services available in that room.
- `ContractPolicy` stores `paymentDueDay` and `paymentGraceDays`; contracts copy these values into `policySnapshot` when created.
- `Invoice.adjustments` records approved positive or negative adjustments. The invoice total must equal line totals plus adjustment amounts.
- `CheckoutSettlement` records the staff member and timestamp that confirm a deposit refund.
