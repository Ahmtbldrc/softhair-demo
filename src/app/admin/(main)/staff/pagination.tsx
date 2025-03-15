import { Pagination as PaginationShad,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious } from '@/components/ui/pagination';
import { StaffType } from '@/lib/types';
import React from 'react'


type Props = {
    filteredStaff: StaffType[],
    itemsPerPage: number,
    currentPage: number,
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}

function Pagination({filteredStaff, itemsPerPage, currentPage, setCurrentPage}: Props) {
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)

  return (
    <PaginationShad>
        <PaginationContent>
            <PaginationItem>
            <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                e.preventDefault();
                setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
                <PaginationLink 
                href="#" 
                onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
                }}
                isActive={currentPage === i + 1}
                >
                {i + 1}
                </PaginationLink>
            </PaginationItem>
            ))}
            <PaginationItem>
            <PaginationNext 
                href="#" 
                onClick={(e) => {
                e.preventDefault();
                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
            </PaginationItem>
        </PaginationContent>
    </PaginationShad>
  )
}

export default Pagination