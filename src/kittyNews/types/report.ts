export interface ReportType {
    Day: number;
    [key: string]: any;
    SaleCreated: number;
    SaleCancelled: number;
    SaleSuccessful: number;
    ethPrice: number;
}
