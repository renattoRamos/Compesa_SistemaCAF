import { useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Control, FieldValues, FieldPath, ControllerRenderProps } from "react-hook-form";

import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DatePickerFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
}

function DatePickerInput<TFieldValues extends FieldValues>({
  field,
  label,
  placeholder,
}: {
  field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>;
  label: string;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (field.value && isValid(field.value)) {
      setInputValue(format(field.value, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [field.value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length === 10) {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate)) {
        field.onChange(parsedDate);
      }
    }
  };

  const handleBlur = () => {
    const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
    if (isValid(parsedDate)) {
      if (field.value?.getTime() !== parsedDate.getTime()) {
        field.onChange(parsedDate);
      }
    } else {
      field.onChange(undefined);
      setInputValue("");
    }
  };

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative group cursor-pointer">
            <FormControl>
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="border-primary/40"
              />
            </FormControl>
            <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-hover:text-foreground">
              <CalendarIcon className="h-4 w-4" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}

export function DatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = "DD/MM/AAAA",
}: DatePickerFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <DatePickerInput field={field} label={label} placeholder={placeholder} />
      )}
    />
  );
}