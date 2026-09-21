export const modules = {
 buildings: { title:'Properties', model:'Building', group:'PROPERTY', roles:['ADMIN','MANAGER'], fields:['name','address','status'], description:'Your buildings and property management assignments.' },
 contracts: { title:'Contracts', model:'Contract', group:'OPERATIONS', roles:['ADMIN','MANAGER','TENANT'], fields:['code','startDate','endDate','rent','deposit','status'], description:'Lease agreements, terms and approval status.' },
 requests: { title:'Rental requests', model:'RentalRequest', group:'OPERATIONS', roles:['ADMIN','MANAGER','TENANT'], fields:['message','status','createdAt'], description:'Track rental enquiries and their progress.' },
 readings: { title:'Utility readings', model:'UtilityReading', group:'OPERATIONS', roles:['ADMIN','MANAGER'], fields:['period','electricityPrevious','electricityCurrent','waterPrevious','waterCurrent'], description:'Monthly electricity and water meter readings.' },
 invoices: { title:'Invoices', model:'Invoice', group:'FINANCE', roles:['ADMIN','MANAGER','TENANT'], fields:['code','period','total','paidAmount','dueDate','status'], description:'Monthly bills, due dates and payment progress.' },
 payments: { title:'Payments', model:'Payment', group:'FINANCE', roles:['ADMIN','MANAGER','TENANT'], fields:['amount','method','status','paidAt'], description:'Payment history and transaction status.' },
 deposits: { title:'Deposits', model:'DepositTransaction', group:'FINANCE', roles:['ADMIN','MANAGER','TENANT'], fields:['type','amount','occurredAt','note'], description:'Security deposits received, applied and refunded.' },
 checkouts: { title:'Move-out requests', model:'CheckoutRequest', group:'OPERATIONS', roles:['ADMIN','MANAGER','TENANT'], fields:['requestedDate','reason','status'], description:'Move-out requests and handover progress.' },
 notifications: { title:'Notifications', model:'Notification', group:'ACCOUNT', roles:['ADMIN','MANAGER','TENANT'], fields:['title','body','createdAt','readAt'], description:'Updates and reminders sent to you.' },
 rates: { title:'Utility rates', model:'UtilityRate', group:'SETTINGS', roles:['ADMIN'], fields:['effectiveFrom','electricityPrice','waterPrice'], description:'Electricity and water prices by effective date.' },
 fees: { title:'Service fees', model:'ServiceFee', group:'SETTINGS', roles:['ADMIN'], fields:['name','code','unit','price','active'], description:'Recurring service charges across your properties.' },
 policies: { title:'Contract policies', model:'ContractPolicy', group:'SETTINGS', roles:['ADMIN'], fields:['version','minMonths','noticeDays','terms'], description:'Lease policies and minimum rental periods.' }
};
