"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface SingleSelectProps {
    /**
     * An array of option objects to be displayed in the select component.
     * Each option object has a label and value.
     */
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];

    /**
     * Callback function triggered when the selected value changes.
     * Receives the new selected value.
     */
    onValueChange: (value: string) => void;

    /** The current selected value. */
    value?: string;

    /** The default selected value when the component mounts. */
    defaultValue?: string;

    /**
     * Additional class names to apply custom styles to the select component.
     */
    className?: string;
}

export const SingleSelect = React.forwardRef<HTMLButtonElement, SingleSelectProps>(
    (
        {
            options,
            onValueChange,
            value,
            defaultValue,
            className,
        },
        ref
    ) => {
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
        const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
            value || defaultValue
        );

        React.useEffect(() => {
            if (value !== undefined) {
                setSelectedValue(value);
            }
        }, [value]);

        const handleSelect = (currentValue: string) => {
            setSelectedValue(currentValue);
            onValueChange(currentValue);
            setIsPopoverOpen(false);
        };

        const selectedOption = options.find((option) => option.value === selectedValue);

        return (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className={cn(
                            "w-full justify-between font-normal",
                            !selectedValue && "text-muted-foreground",
                            className
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {selectedOption?.icon && (
                                <selectedOption.icon className="h-4 w-4" />
                            )}
                            {selectedOption?.label || "Select option"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => {
                                    const isSelected = selectedValue === option.value;
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => handleSelect(option.value)}
                                            className="cursor-pointer"
                                        >
                                            {option.icon && (
                                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }
);

SingleSelect.displayName = "SingleSelect";
