from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class PartyCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    address: Optional[str] = ""
    openingBalance: Optional[float] = 0.0
    model_config = ConfigDict(extra="ignore")


class LoadCreate(BaseModel):
    date: Optional[Any] = None
    vehicleNo: Optional[str] = ""
    party: Optional[str] = None
    sandType: Optional[str] = "Sand"
    royaltyPassNo: Optional[str] = ""
    emptyKg: Optional[float] = 0.0
    loadedKg: Optional[float] = 0.0
    netTon: Optional[float] = 0.0
    royaltyTon: Optional[float] = 0.0
    cash: Optional[float] = 0.0
    rate: Optional[float] = 0.0
    district: Optional[str] = ""
    notes: Optional[str] = ""
    amount: Optional[float] = 0.0
    model_config = ConfigDict(extra="ignore")


class PaymentCreate(BaseModel):
    date: Optional[Any] = None
    party: Optional[str] = None
    amount: Optional[float] = 0.0
    mode: Optional[str] = "Cash"
    notes: Optional[str] = ""
    model_config = ConfigDict(extra="ignore")


class EmployeeCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    role: Optional[str] = ""
    model_config = ConfigDict(extra="ignore")


class EmpEntryCreate(BaseModel):
    date: Optional[Any] = None
    employee: Optional[str] = None
    type: Optional[str] = "earned"  # earned | paid | advance
    amount: Optional[float] = 0.0
    notes: Optional[str] = ""
    model_config = ConfigDict(extra="ignore")


class ExpenseCreate(BaseModel):
    date: Optional[Any] = None
    category: Optional[str] = "other"  # diesel | repair | elec | rent | other
    name: Optional[str] = ""
    amount: Optional[float] = 0.0
    notes: Optional[str] = ""
    model_config = ConfigDict(extra="ignore")
